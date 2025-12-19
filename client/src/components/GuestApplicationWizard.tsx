import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, CheckCircle, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { validateApplicationForm, validateEmail, validatePhoneNumber } from "@/lib/validation";

interface GuestApplicationWizardProps {
  jobId: number;
  jobTitle: string;
  companyName?: string;
}

type Step = "upload" | "details" | "submit";

export function GuestApplicationWizard({ jobId, jobTitle, companyName }: GuestApplicationWizardProps) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [guestApplicationId, setGuestApplicationId] = useState<number | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    coverLetter: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const submitMutation = trpc.guestApplication.submit.useMutation({
    onSuccess: (data) => {
      setParsedData(data.parsedData);
      setGuestApplicationId(data.guestApplicationId);
      
      // Pre-fill form with parsed data
      setFormData(prev => ({
        ...prev,
        name: data.parsedData.personalInfo?.name || prev.name,
        email: data.parsedData.personalInfo?.email || prev.email,
        phoneNumber: data.parsedData.personalInfo?.phone || prev.phoneNumber,
      }));
      
      toast.success("Resume uploaded and parsed successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to upload resume: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF and DOCX files are allowed");
        return;
      }

      setResumeFile(file);
    }
  };

  const handleUploadResume = async () => {
    if (!resumeFile) {
      toast.error("Please select a resume file");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        await submitMutation.mutateAsync({
          jobId,
          resumeBase64: base64,
          resumeFilename: resumeFile.name,
        });
      };
      reader.readAsDataURL(resumeFile);
    } catch (error: any) {
      toast.error(`Failed to process resume: ${error.message}`);
    }
  };

  const steps: Step[] = ["upload", "details", "submit"];
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (currentStep === "upload") {
      if (!parsedData) {
        handleUploadResume();
        return;
      }
      // If already parsed, move to details
      setCurrentStep("details");
      return;
    }

    if (currentStep === "details") {
      // Validate essential info
      const validationErrors = validateApplicationForm({
        fullName: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        coverLetter: formData.coverLetter || undefined,
      });
      
      if (!formData.name || !formData.email) {
        validationErrors.name = validationErrors.fullName || "Name is required";
        validationErrors.email = validationErrors.email || "Email is required";
      }
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        toast.error("Please fix the errors in the form");
        return;
      }
      
      setErrors({});
      setCurrentStep("submit");
      return;
    }

    if (currentStep === "submit") {
      handleSubmit();
      return;
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    toast.success("Application submitted successfully!");
    // Redirect to jobs page after successful submission
    setTimeout(() => setLocation("/jobs"), 2000);
  };

  const renderUploadStep = () => {
    // If resume is uploaded and parsed, show review
    if (parsedData) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Review Extracted Information
            </CardTitle>
            <CardDescription>
              Please review and edit the information extracted from your resume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Personal Information */}
              {parsedData.personalInfo && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-700">Personal Information</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    {parsedData.personalInfo.name && (
                      <div>
                        <Label className="text-xs text-gray-600">Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    )}
                    {parsedData.personalInfo.email && (
                      <div>
                        <Label className="text-xs text-gray-600">Email</Label>
                        <Input
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    )}
                    {parsedData.personalInfo.phone && (
                      <div>
                        <Label className="text-xs text-gray-600">Phone</Label>
                        <Input
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {parsedData.skills && parsedData.skills.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-700">Skills</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {parsedData.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Experience */}
              {parsedData.experience && parsedData.experience.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-700">Experience</h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                    {parsedData.experience.map((exp: any, index: number) => (
                      <div key={index} className="border-b border-purple-200 last:border-0 pb-3 last:pb-0">
                        <p className="font-medium text-sm">{exp.title}</p>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                        {exp.duration && (
                          <p className="text-xs text-gray-500">{exp.duration}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {parsedData.education && parsedData.education.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-700">Education</h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                    {parsedData.education.map((edu: any, index: number) => (
                      <div key={index} className="border-b border-orange-200 last:border-0 pb-3 last:pb-0">
                        <p className="font-medium text-sm">{edu.degree}</p>
                        <p className="text-sm text-gray-600">{edu.institution}</p>
                        {edu.year && (
                          <p className="text-xs text-gray-500">{edu.year}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> You can edit the extracted information above. Click Continue to proceed with your application.
              </p>
            </div>

            <div className="flex justify-between gap-2">
              <Button onClick={() => {
                setParsedData(null);
                setResumeFile(null);
              }} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Upload Different Resume
              </Button>
              <Button onClick={handleNext}>
                Continue to Application
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Otherwise show upload form
    return (
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
            <Button onClick={() => setLocation(`/jobs/${jobId}`)} variant="outline">
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
  };

  const renderDetailsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Additional Details
        </CardTitle>
        <CardDescription>
          Confirm your contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            className={errors.name || errors.fullName ? "border-red-500" : ""}
          />
          {(errors.name || errors.fullName) && <p className="text-sm text-red-500 mt-1">{errors.name || errors.fullName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) {
                setErrors({ ...errors, email: "" });
              }
            }}
            onBlur={() => {
              if (formData.email) {
                const error = validateEmail(formData.email);
                if (error) {
                  setErrors({ ...errors, email: error });
                }
              }
            }}
            placeholder="john@example.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber}
            className={errors.phoneNumber ? "border-red-500" : ""}
            onChange={(e) => {
              setFormData({ ...formData, phoneNumber: e.target.value });
              if (errors.phoneNumber) {
                setErrors({ ...errors, phoneNumber: "" });
              }
            }}
            onBlur={() => {
              if (formData.phoneNumber) {
                const error = validatePhoneNumber(formData.phoneNumber);
                if (error) {
                  setErrors({ ...errors, phoneNumber: error });
                }
              }
            }}
            placeholder="+1 (555) 123-4567"
          />
          {errors.phoneNumber && <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>}
        </div>

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

  const renderSubmitStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Final Step - Submit Application
        </CardTitle>
        <CardDescription>
          Add a cover letter (optional) and submit your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
          <Textarea
            id="coverLetter"
            value={formData.coverLetter}
            onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
            placeholder="Tell us why you're interested in this position and why you'd be a great fit..."
            rows={8}
          />
          <p className="text-xs text-gray-500">
            A well-written cover letter can help you stand out from other candidates.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2">Application Summary</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Name:</strong> {formData.name}</p>
            <p><strong>Email:</strong> {formData.email}</p>
            {formData.phoneNumber && <p><strong>Phone:</strong> {formData.phoneNumber}</p>}
            <p><strong>Job:</strong> {jobTitle}</p>
            {companyName && <p><strong>Company:</strong> {companyName}</p>}
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Application
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderProgressBar = () => {
    const progress = ((currentStepIndex + 1) / steps.length) * 100;
    return (
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-2xl py-8">
      {renderProgressBar()}
      
      {currentStep === "upload" && renderUploadStep()}
      {currentStep === "details" && renderDetailsStep()}
      {currentStep === "submit" && renderSubmitStep()}
    </div>
  );
}
