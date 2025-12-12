import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Briefcase, FileText, Eye, TrendingUp, Upload, Search, Users, MessageSquare, Loader2, Heart } from "lucide-react";
import { BookmarkButton } from "@/components/BookmarkButton";
import { DeadlineBadge } from "@/components/DeadlineBadge";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import CandidateOnboarding from "@/components/CandidateOnboarding";
import VideoIntroduction from "@/components/VideoIntroduction";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";

export default function CandidateDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
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
  useState(() => {
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
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Convert file to base64
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

  if (authLoading || candidateLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <>
      <CandidateOnboarding 
        open={showOnboarding} 
        onComplete={() => setShowOnboarding(false)} 
      />
      
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">
              HG
            </div>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HotGigs
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <span className="text-xs sm:text-sm text-gray-600 hidden md:inline">Welcome, {candidate?.fullName || user.name}</span>
            <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Profile Completion Banner */}
        {completionStatus && completionStatus.percentage !== undefined && completionStatus.percentage < 100 && (
          <ProfileCompletionBanner 
            percentage={completionStatus.percentage} 
            role="candidate"
          />
        )}
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
              <p className="text-xs text-muted-foreground">Total applications submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.interviews || 0}</div>
              <p className="text-xs text-muted-foreground">Interview invitations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.profileViews || 0}</div>
              <p className="text-xs text-muted-foreground">Recruiters viewed your profile</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resume Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.resumeScore || 0}%</div>
              <p className="text-xs text-muted-foreground">ATS compatibility score</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
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
                      className="w-full"
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
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {candidate?.bio && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Bio:</span>
                        <p className="text-sm mt-1 text-gray-700">{candidate.bio}</p>
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
                        <FileText className="h-8 w-8 text-blue-600" />
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
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
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
                <CardTitle>Recommended Jobs</CardTitle>
                <CardDescription>Jobs matching your profile</CardDescription>
              </CardHeader>
              <CardContent>
                {recommendedJobs && recommendedJobs.length > 0 ? (
                  <div className="space-y-4">
                    {recommendedJobs.map((job: any) => (
                      <div
                        key={job.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 cursor-pointer" onClick={() => setLocation(`/jobs/${job.id}`)}>
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
                        <p className="text-sm text-gray-700 mb-2 cursor-pointer" onClick={() => setLocation(`/jobs/${job.id}`)}>{job.location}</p>
                        <div className="flex gap-2 cursor-pointer" onClick={() => setLocation(`/jobs/${job.id}`)}>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {job.type}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                            ${job.salaryMin}-${job.salaryMax}
                          </span>
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

          {/* Sidebar */}
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
                  onClick={() => setLocation("/resume-upload")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Upload with AI Parsing
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
            <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
              <CardHeader>
                <CardTitle>AI Career Coach</CardTitle>
                <CardDescription className="text-blue-100">
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
      </div>
    </div>
    </>
  );
}
