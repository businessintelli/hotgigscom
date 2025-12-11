import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, CheckCircle, ArrowLeft } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

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

  // Fetch job details
  const { data: job, isLoading: jobLoading } = trpc.job.getById.useQuery({ id: jobId });

  // Fetch candidate profile
  const { data: candidate, isLoading: candidateLoading } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Submit application mutation
  const submitApplicationMutation = trpc.application.submit.useMutation({
    onSuccess: () => {
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

    setIsSubmitting(true);

    try {
      let resumeUrl = candidate.resumeUrl;
      let resumeFilename = candidate.resumeFilename;

      // If using custom resume, convert to base64
      if (useCustomResume && customResumeFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(customResumeFile);
        });

        resumeUrl = await base64Promise;
        resumeFilename = customResumeFile.name;
      }

      await submitApplicationMutation.mutateAsync({
        jobId,
        candidateId: candidate.id,
        coverLetter: coverLetter || undefined,
        resumeUrl: resumeUrl!,
        resumeFilename: resumeFilename || undefined,
      });
    } catch (error) {
      setIsSubmitting(false);
      toast.error("Failed to process resume");
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
              <Button onClick={() => setLocation("/candidate-dashboard")} className="flex-1">
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
                        <Button variant="outline" size="sm" asChild>
                          <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCustomResumeFile(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = "";
                                }
                              }}
                              className="ml-auto"
                            >
                              Remove
                            </Button>
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

                {/* Cover Letter */}
                <div>
                  <Label htmlFor="coverLetter">
                    Cover Letter <span className="text-gray-500">(Optional)</span>
                  </Label>
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
    </div>
  );
}
