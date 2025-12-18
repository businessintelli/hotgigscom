import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, User, Mail, Phone, CheckCircle, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface GuestApplicationWizardProps {
  jobId: number;
  jobTitle: string;
  companyName?: string;
}

type Step = "upload" | "review" | "details" | "confirmation";

export function GuestApplicationWizard({ jobId, jobTitle, companyName }: GuestApplicationWizardProps) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<string>("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [guestApplicationId, setGuestApplicationId] = useState<number | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    coverLetter: "",
  });

  const submitMutation = trpc.guestApplication.submit.useMutation({
    onSuccess: (data) => {
      setParsedData(data.parsedData);
      setGuestApplicationId(data.guestApplicationId);
      
      // Pre-fill form with parsed data
      setFormData(prev => ({
        ...prev,
        name: data.parsedData.name || prev.name,
        email: data.parsedData.email || prev.email,
        phoneNumber: data.parsedData.phone || prev.phoneNumber,
      }));
      
      setCurrentStep("review");
      toast.success("Resume uploaded and parsed successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to upload resume: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or DOCX file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setResumeFile(file);
  };

  const handleUploadResume = async () => {
    if (!resumeFile) {
      toast.error("Please select a resume file");
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const base64Content = base64Data.split(",")[1]; // Remove data:mime;base64, prefix

        setResumeData(base64Content);

        // Submit to backend for parsing
        submitMutation.mutate({
          jobId,
          email: formData.email || "temp@example.com", // Temporary, will be updated in details step
          name: formData.name || "Applicant", // Temporary
          phoneNumber: formData.phoneNumber,
          coverLetter: formData.coverLetter,
          resumeFile: {
            data: base64Content,
            filename: resumeFile.name,
            mimeType: resumeFile.type,
          },
        });
      };
      reader.readAsDataURL(resumeFile);
    } catch (error: any) {
      toast.error(`Failed to process resume: ${error.message}`);
    }
  };

  const handleNext = () => {
    if (currentStep === "upload") {
      handleUploadResume();
    } else if (currentStep === "review") {
      // Validate parsed data looks good
      if (!parsedData) {
        toast.error("Resume data not available");
        return;
      }
      setCurrentStep("details");
    } else if (currentStep === "details") {
      // Validate required fields
      if (!formData.name || !formData.email) {
        toast.error("Please fill in all required fields");
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      setCurrentStep("confirmation");
    }
  };

  const handleBack = () => {
    if (currentStep === "review") {
      setCurrentStep("upload");
      setResumeFile(null);
      setParsedData(null);
    } else if (currentStep === "details") {
      setCurrentStep("review");
    } else if (currentStep === "confirmation") {
      setCurrentStep("details");
    }
  };

  const renderUploadStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Your Resume
        </CardTitle>
        <CardDescription>
          Upload your resume and we'll automatically extract your information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            id="resume-upload"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="resume-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {resumeFile ? (
              <>
                <FileText className="w-12 h-12 text-green-600" />
                <p className="text-sm font-medium">{resumeFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(resumeFile.size / 1024).toFixed(2)} KB
                </p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400" />
                <p className="text-sm font-medium">Click to upload resume</p>
                <p className="text-xs text-gray-500">PDF or DOCX (max 5MB)</p>
              </>
            )}
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={() => setLocation(`/jobs/${jobId}`)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleNext}
            disabled={!resumeFile || submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Parsing Resume...
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderReviewStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Review Extracted Information
        </CardTitle>
        <CardDescription>
          We've extracted the following information from your resume
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {parsedData && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div>
                <Label className="text-sm font-semibold">Name</Label>
                <p className="text-sm">{parsedData.name || "Not found"}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Email</Label>
                <p className="text-sm">{parsedData.email || "Not found"}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Phone</Label>
                <p className="text-sm">{parsedData.phone || "Not found"}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Experience</Label>
                <p className="text-sm">
                  {parsedData.experienceYears
                    ? `${parsedData.experienceYears} years`
                    : "Not specified"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Skills</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {parsedData.skills && parsedData.skills.length > 0 ? (
                    parsedData.skills.slice(0, 10).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No skills found</p>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              You'll be able to review and edit this information in the next step.
            </p>
          </div>
        )}

        <div className="flex justify-between gap-2">
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderDetailsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Confirm Your Details
        </CardTitle>
        <CardDescription>
          Please confirm or update your contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.doe@example.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll send your application confirmation to this email
            </p>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
            <Textarea
              id="coverLetter"
              value={formData.coverLetter}
              onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
              placeholder="Tell us why you're interested in this position..."
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext}>
            Submit Application
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderConfirmationStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-6 h-6" />
          Application Submitted Successfully!
        </CardTitle>
        <CardDescription>
          We've received your application for {jobTitle}
          {companyName && ` at ${companyName}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-green-800">What happens next?</p>
          <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
            <li>You'll receive a confirmation email at {formData.email}</li>
            <li>The hiring team will review your application</li>
            <li>You'll be notified if you're selected for an interview</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-blue-800">Want to track your application?</p>
          <p className="text-sm text-blue-700">
            Create an account to view your application status, apply to more jobs, and get personalized job recommendations.
          </p>
          <Button
            onClick={() => setLocation(`/signup?email=${encodeURIComponent(formData.email)}`)}
            className="w-full mt-2"
          >
            Create Account
          </Button>
        </div>

        <div className="flex justify-center gap-2">
          <Button onClick={() => setLocation("/jobs")} variant="outline">
            Browse More Jobs
          </Button>
          <Button onClick={() => setLocation("/")}>
            Back to Home
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container max-w-2xl py-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className={`flex items-center gap-2 ${currentStep === "upload" ? "text-blue-600 font-semibold" : currentStep !== "upload" ? "text-green-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "upload" ? "bg-blue-600 text-white" : "bg-green-600 text-white"}`}>
              {["review", "details", "confirmation"].includes(currentStep) ? <CheckCircle className="w-5 h-5" /> : "1"}
            </div>
            <span className="text-sm">Upload</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep === "review" || currentStep === "details" || currentStep === "confirmation" ? "bg-green-600" : "bg-gray-200"}`} />
          <div className={`flex items-center gap-2 ${currentStep === "review" ? "text-blue-600 font-semibold" : currentStep === "details" || currentStep === "confirmation" ? "text-green-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "review" ? "bg-blue-600 text-white" : currentStep === "details" || currentStep === "confirmation" ? "bg-green-600 text-white" : "bg-gray-200"}`}>
              {currentStep === "details" || currentStep === "confirmation" ? <CheckCircle className="w-5 h-5" /> : "2"}
            </div>
            <span className="text-sm">Review</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep === "details" || currentStep === "confirmation" ? "bg-green-600" : "bg-gray-200"}`} />
          <div className={`flex items-center gap-2 ${currentStep === "details" ? "text-blue-600 font-semibold" : currentStep === "confirmation" ? "text-green-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "details" ? "bg-blue-600 text-white" : currentStep === "confirmation" ? "bg-green-600 text-white" : "bg-gray-200"}`}>
              {currentStep === "confirmation" ? <CheckCircle className="w-5 h-5" /> : "3"}
            </div>
            <span className="text-sm">Details</span>
          </div>
        </div>
      </div>

      {/* Step content */}
      {currentStep === "upload" && renderUploadStep()}
      {currentStep === "review" && renderReviewStep()}
      {currentStep === "details" && renderDetailsStep()}
      {currentStep === "confirmation" && renderConfirmationStep()}
    </div>
  );
}
