import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Target, TrendingUp, Users, Briefcase, Search, Filter, Download, Mail, Phone, MapPin, Calendar, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function AIMatchingDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [skillFilter, setSkillFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [minMatchScore, setMinMatchScore] = useState(0);

  // Fetch recruiter profile
  const { data: recruiter } = trpc.recruiter.getProfile.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  // Fetch all jobs for this recruiter
  const { data: jobs = [], isLoading: jobsLoading } = trpc.job.list.useQuery(undefined, {
    enabled: !!recruiter?.id,
  });

  // Fetch matched candidates for selected job
  const { data: matchedCandidates = [], isLoading: candidatesLoading, refetch } = trpc.application.getMatchedCandidates.useQuery(
    { jobId: selectedJobId || 0 },
    { enabled: !!selectedJobId }
  );

  if (authLoading || jobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  // Filter candidates based on filters
  const filteredCandidates = matchedCandidates.filter((candidate: any) => {
    const matchesSkill = !skillFilter || 
      candidate.matchingSkills?.some((skill: string) => 
        skill.toLowerCase().includes(skillFilter.toLowerCase())
      );
    
    const matchesExperience = experienceFilter === "all" || 
      (experienceFilter === "junior" && candidate.candidate.experienceYears < 3) ||
      (experienceFilter === "mid" && candidate.candidate.experienceYears >= 3 && candidate.candidate.experienceYears < 7) ||
      (experienceFilter === "senior" && candidate.candidate.experienceYears >= 7);
    
    const matchesScore = candidate.matchScore >= minMatchScore;
    
    return matchesSkill && matchesExperience && matchesScore;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case "strong_match":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Strong Match</Badge>;
      case "good_match":
        return <Badge className="bg-blue-500"><CheckCircle2 className="h-3 w-3 mr-1" />Good Match</Badge>;
      case "review":
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Review</Badge>;
      case "weak_match":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Weak Match</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const selectedJob = jobs.find((job: any) => job.id === selectedJobId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setLocation("/recruiter/dashboard")}>
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Matching Dashboard</h1>
                <p className="text-sm text-gray-600">Find the perfect candidates with AI-powered matching</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                <Target className="h-4 w-4 mr-1" />
                AI-Powered
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Job Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Select Job Position
            </CardTitle>
            <CardDescription>Choose a job to view matched candidates</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedJobId?.toString() || ""} onValueChange={(value) => setSelectedJobId(parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a job position..." />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job: any) => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.title} - {job.location} ({job.employmentType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedJobId && selectedJob && (
          <>
            {/* Job Details */}
            <Card className="mb-6 border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedJob.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedJob.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {selectedJob.employmentType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Posted {new Date(selectedJob.createdAt).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className={selectedJob.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                    {selectedJob.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 line-clamp-2">{selectedJob.description}</p>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Applicants</p>
                      <p className="text-2xl font-bold text-gray-900">{matchedCandidates.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Strong Matches</p>
                      <p className="text-2xl font-bold text-green-600">
                        {matchedCandidates.filter((c: any) => c.matchScore >= 80).length}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Match Score</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {matchedCandidates.length > 0
                          ? Math.round(matchedCandidates.reduce((sum: number, c: any) => sum + c.matchScore, 0) / matchedCandidates.length)
                          : 0}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Filtered Results</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredCandidates.length}</p>
                    </div>
                    <Filter className="h-8 w-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Candidates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search Skills</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="e.g., React, Python..."
                        value={skillFilter}
                        onChange={(e) => setSkillFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Experience Level</label>
                    <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="junior">Junior (0-3 years)</SelectItem>
                        <SelectItem value="mid">Mid-Level (3-7 years)</SelectItem>
                        <SelectItem value="senior">Senior (7+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Min Match Score</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={minMatchScore}
                      onChange={(e) => setMinMatchScore(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSkillFilter("");
                        setExperienceFilter("all");
                        setMinMatchScore(0);
                      }}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidates List */}
            {candidatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCandidates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No candidates match your filters</p>
                  <Button variant="outline" onClick={() => {
                    setSkillFilter("");
                    setExperienceFilter("all");
                    setMinMatchScore(0);
                  }} className="mt-4">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((application: any) => (
                  <Card key={application.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {application.candidate.fullName || "Anonymous Candidate"}
                            </h3>
                            {getRecommendationBadge(application.recommendation)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            {application.candidate.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {application.candidate.email}
                              </span>
                            )}
                            {application.candidate.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {application.candidate.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {application.candidate.experienceYears} years exp
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getScoreColor(application.matchScore)} px-4 py-2 rounded-lg`}>
                            {application.matchScore}%
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Match Score</p>
                        </div>
                      </div>

                      {/* Skills Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Matching Skills ({application.skillsScore}%)</p>
                          <div className="flex flex-wrap gap-2">
                            {application.matchingSkills?.slice(0, 5).map((skill: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {skill}
                              </Badge>
                            ))}
                            {application.matchingSkills?.length > 5 && (
                              <Badge variant="outline">+{application.matchingSkills.length - 5} more</Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Missing Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {application.missingSkills?.slice(0, 5).map((skill: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                {skill}
                              </Badge>
                            ))}
                            {application.missingSkills?.length > 5 && (
                              <Badge variant="outline">+{application.missingSkills.length - 5} more</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Experience Score */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-700">Experience Match</p>
                          <p className="text-sm font-semibold text-gray-900">{application.experienceScore}%</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${application.experienceScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Cover Letter */}
                      {application.coverLetter && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Cover Letter</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{application.coverLetter}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t">
                        {application.resumeUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-1" />
                              View Resume
                            </a>
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Shortlist
                        </Button>
                        <Button variant="outline" size="sm">
                          Schedule Interview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {!selectedJobId && (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a job position to view matched candidates</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
