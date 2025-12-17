import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, CheckCircle, ArrowLeft, Video } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ResumePreviewModal } from "@/components/ResumePreviewModal";
import SkillMatrixForm, { SkillRating, validateSkillMatrix } from "@/components/SkillMatrixForm";
import ExtendedCandidateInfoForm, { ExtendedCandidateInfo } from "@/components/ExtendedCandidateInfoForm";
import ApplicationProgressTracker, { ProgressSection } from "@/components/ApplicationProgressTracker";

export default function JobApplication() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const jobId = parseInt(params.id || "0");
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [useCustomResume, setUseCustomResume] = useState(false);
  const [customResumeFile, setCustomResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewResumeUrl, setPreviewResumeUrl] = useState("");
  const [previewResumeFilename, setPreviewResumeFilename] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedResumeProfileId, setSelectedResumeProfileId] = useState<number | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [skillRatings, setSkillRatings] = useState<SkillRating[]>([]);
  const [showSkillValidation, setShowSkillValidation] = useState(false);
  const [extendedInfo, setExtendedInfo] = useState<ExtendedCandidateInfo>({});
  const [currentSection, setCurrentSection] = useState<string>("resume");
  
  // Upload resume mutation
  const uploadResumeMutation = trpc.candidate.uploadResume.useMutation();
  
  // Draft key for localStorage
  const draftKey = `job-application-draft-${jobId}`;
  
  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setCoverLetter(draft.coverLetter || "");
        setUseCustomResume(draft.useCustomResume || false);
        toast.info("Draft restored", { duration: 2000 });
      } catch (error) {
        console.error("Failed to restore draft:", error);
      }
    }
  }, [jobId]);
  
  // Auto-save draft
  useEffect(() => {
    if (!coverLetter && !useCustomResume) return; // Don't save empty drafts
    
    const timeoutId = setTimeout(() => {
      const draft = {
        coverLetter,
        useCustomResume,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
      setLastSaved(new Date());
    }, 1000); // Save 1 second after user stops typing
    
    return () => clearTimeout(timeoutId);
  }, [coverLetter, useCustomResume, draftKey]);
  
  // Clear draft on successful submission
  useEffect(() => {
    if (isSubmitted) {
      localStorage.removeItem(draftKey);
    }
  }, [isSubmitted, draftKey]);

  // Fetch job details
  const { data: job, isLoading: jobLoading } = trpc.job.getById.useQuery({ id: jobId });

  // Fetch candidate profile
  const { data: candidate, isLoading: candidateLoading } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Fetch resume profiles
  const { data: resumeProfiles = [] } = trpc.resumeProfile.getResumeProfiles.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

  // Fetch video introduction
  const { data: videoIntroduction } = trpc.resumeProfile.getVideoIntroduction.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

  // Fetch job skill requirements
  const { data: skillRequirements = [] } = trpc.skillMatrix.getJobSkillRequirements.useQuery(
    { jobId },
    { enabled: jobId > 0 }
  );

  // Submit skill ratings mutation
  const submitSkillRatingsMutation = trpc.skillMatrix.submitSkillRatings.useMutation();

  // Submit application mutation
  const submitApplicationMutation = trpc.application.submit.useMutation({
    onSuccess: async (data) => {
      // Submit skill ratings if any
      if (skillRatings.length > 0 && data?.id) {
        try {
          await submitSkillRatingsMutation.mutateAsync({
            applicationId: data.id,
            ratings: skillRatings,
          });
        } catch (error) {
          console.error('Failed to save skill ratings:', error);
        }
      }
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Application submitted successfully!");
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      toast.error(`Failed to submit application: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF or Word document");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      
      setCustomResumeFile(file);
      toast.success("Resume selected successfully");
    }
  };

  const handleSubmit = async () => {
    if (!candidate?.id) {
      toast.error("Please complete your profile first");
      setLocation("/candidate-dashboard");
      return;
    }

    // Check if we have a resume (either profile or custom)
    if (!useCustomResume && !candidate.resumeUrl) {
      toast.error("Please upload your resume first");
      setLocation("/candidate-dashboard");
      return;
    }

    if (useCustomResume && !customResumeFile) {
      toast.error("Please select a resume file");
      return;
    }

    // Validate skill matrix if required
    if (skillRequirements.length > 0) {
      const isValid = validateSkillMatrix(skillRequirements, skillRatings);
      if (!isValid) {
        setShowSkillValidation(true);
        toast.error("Please complete all required skills in the skill matrix");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let resumeUrl = candidate.resumeUrl;
      let resumeFilename = candidate.resumeFilename;

      // If using custom resume, upload to S3 first
      if (useCustomResume && customResumeFile) {
        toast.info("Uploading resume...");
        
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(customResumeFile);
        });

        const fileData = await base64Promise;
        
        // Upload to S3 via tRPC (without auto-fill to avoid overwriting profile)
        const uploadResult = await uploadResumeMutation.mutateAsync({
          candidateId: candidate.id,
          fileData,
          fileName: customResumeFile.name,
          autoFill: false, // Don't overwrite profile data
        });
        
        resumeUrl = uploadResult.url;
        resumeFilename = customResumeFile.name;
        toast.success("Resume uploaded successfully");
      }

      await submitApplicationMutation.mutateAsync({
        jobId,
        candidateId: candidate.id,
        coverLetter: coverLetter || undefined,
        resumeUrl: resumeUrl!,
        resumeFilename: resumeFilename || undefined,
        resumeProfileId: selectedResumeProfileId || undefined,
        videoIntroductionId: selectedVideoId || undefined,
        extendedInfo,
      });
    } catch (error: any) {
      setIsSubmitting(false);
      toast.error(`Failed to submit application: ${error.message || 'Unknown error'}`);
    }
  };

  if (jobLoading || candidateLoading) {
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

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Job not found</h2>
          <Button onClick={() => setLocation("/jobs")}>Browse Jobs</Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your application for <strong>{job.title}</strong> has been successfully submitted. The
              recruiter will review your application and get back to you soon.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setLocation("/jobs")} variant="outline" className="flex-1">
                Browse More Jobs
              </Button>
              <Button 
                onClick={() => {
                  // Redirect based on user role
                  const role = user?.role;
                  if (role === 'recruiter') {
                    setLocation("/recruiter/dashboard");
                  } else if (role === 'candidate') {
                    setLocation("/candidate-dashboard");
                  } else {
                    // Fallback to home if role is unknown
                    setLocation("/");
                  }
                }} 
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              HG
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HotGigs
            </h1>
          </div>
          <Button variant="outline" onClick={() => setLocation("/jobs")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Application Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Apply for {job.title}</CardTitle>
                <CardDescription>Complete your application below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Candidate Information */}
                <div>
                  <h3 className="font-semibold mb-3">Your Information</h3>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
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
                  </div>
                </div>

                {/* Resume Profile Selection */}
                {resumeProfiles.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Select Resume Profile</h3>
                    <div className="space-y-2">
                      {resumeProfiles.map((profile) => (
                        <div
                          key={profile.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedResumeProfileId === profile.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedResumeProfileId(profile.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                checked={selectedResumeProfileId === profile.id}
                                onChange={() => setSelectedResumeProfileId(profile.id)}
                                className="w-4 h-4"
                              />
                              <div>
                                <p className="font-medium">{profile.profileName}</p>
                                <p className="text-sm text-gray-600">
                                  Uploaded {new Date(profile.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {profile.isDefault && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Introduction Selection */}
                {videoIntroduction && (
                  <div>
                    <h3 className="font-semibold mb-3">Video Introduction</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="includeVideo"
                        checked={selectedVideoId === videoIntroduction.id}
                        onChange={(e) => setSelectedVideoId(e.target.checked ? videoIntroduction.id : null)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="includeVideo" className="text-sm font-medium cursor-pointer">
                        Include my video introduction
                      </label>
                    </div>
                    {selectedVideoId && (
                      <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Video className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">Video Introduction</p>
                            <p className="text-sm text-gray-600">
                              Duration: {Math.floor(videoIntroduction.duration / 60)}:{(videoIntroduction.duration % 60).toString().padStart(2, '0')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Resume */}
                <div>
                  <h3 className="font-semibold mb-3">Resume</h3>
                  
                  {/* Resume Source Selection */}
                  <div className="space-y-4">
                    {candidate?.resumeUrl && (
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="useProfileResume"
                          name="resumeSource"
                          checked={!useCustomResume}
                          onChange={() => {
                            setUseCustomResume(false);
                            setCustomResumeFile(null);
                          }}
                          className="w-4 h-4"
                        />
                        <label htmlFor="useProfileResume" className="text-sm font-medium cursor-pointer">
                          Use resume from my profile
                        </label>
                      </div>
                    )}

                    {/* Profile Resume Display */}
                    {!useCustomResume && candidate?.resumeUrl && (
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg ml-6">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">Resume attached</p>
                            <p className="text-sm text-green-700">
                              {candidate.resumeFilename || "resume.pdf"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setPreviewResumeUrl(candidate.resumeUrl!);
                              setPreviewResumeFilename(candidate.resumeFilename || "resume.pdf");
                              setShowPreviewModal(true);
                            }}
                          >
                            Preview
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Upload Different Resume Option */}
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="useCustomResume"
                        name="resumeSource"
                        checked={useCustomResume}
                        onChange={() => setUseCustomResume(true)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="useCustomResume" className="text-sm font-medium cursor-pointer">
                        Upload a different resume for this application
                      </label>
                    </div>

                    {/* Custom Resume Upload */}
                    {useCustomResume && (
                      <div className="ml-6 space-y-3">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-gray-600">
                          Accepted formats: PDF, DOC, DOCX (Max 5MB)
                        </p>
                        {customResumeFile && (
                          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                              {customResumeFile.name}
                            </span>
                            <div className="ml-auto flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    setPreviewResumeUrl(e.target?.result as string);
                                    setPreviewResumeFilename(customResumeFile.name);
                                    setShowPreviewModal(true);
                                  };
                                  reader.readAsDataURL(customResumeFile);
                                }}
                              >
                                Preview
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCustomResumeFile(null);
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = "";
                                  }
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* No Profile Resume Warning */}
                    {!candidate?.resumeUrl && !useCustomResume && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-900 font-medium mb-2">No resume in your profile</p>
                        <p className="text-sm text-yellow-700 mb-3">
                          Please upload a resume for this application or add one to your profile
                        </p>
                        <Button onClick={() => setLocation("/candidate-dashboard")} size="sm" variant="outline">
                          Go to Profile
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skill Matrix */}
                {skillRequirements.length > 0 && (
                  <SkillMatrixForm
                    skillRequirements={skillRequirements}
                    ratings={skillRatings}
                    onChange={setSkillRatings}
                    showValidation={showSkillValidation}
                  />
                )}

                {/* Extended Candidate Information */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Additional Information Required</h3>
                  <ExtendedCandidateInfoForm
                    data={extendedInfo}
                    onChange={setExtendedInfo}
                  />
                </div>

                {/* Cover Letter */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="coverLetter">
                      Cover Letter <span className="text-gray-500">(Optional)</span>
                    </Label>
                    {lastSaved && (
                      <span className="text-xs text-gray-500">
                        Saved {lastSaved.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <Textarea
                    id="coverLetter"
                    placeholder="Tell the employer why you're a great fit for this position..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={8}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    A well-written cover letter can increase your chances of getting an interview
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || (!useCustomResume && !candidate?.resumeUrl) || (useCustomResume && !customResumeFile)}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setLocation("/jobs")}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Details Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                  <p className="text-sm text-gray-600">Company Name</p>
                </div>

                {job.location && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Location</p>
                    <p className="text-sm">{job.location}</p>
                  </div>
                )}

                {job.employmentType && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Employment Type</p>
                    <p className="text-sm capitalize">{job.employmentType}</p>
                  </div>
                )}

                {job.salaryMin && job.salaryMax && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Salary Range</p>
                    <p className="text-sm">
                      {job.salaryCurrency || "$"}
                      {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                    </p>
                  </div>
                )}

                {job.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                    <p className="text-sm text-gray-700 line-clamp-4">{job.description}</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => setLocation(`/jobs/${job.id}`)}
                  className="w-full"
                >
                  View Full Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Resume Preview Modal */}
      <ResumePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        resumeUrl={previewResumeUrl}
        resumeFilename={previewResumeFilename}
      />
    </div>
  );
}
