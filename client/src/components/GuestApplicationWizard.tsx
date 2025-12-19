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
import { validateApplicationForm } from "@/lib/validation";

interface GuestApplicationWizardProps {
  jobId: number;
  jobTitle: string;
  companyName?: string;
}

type Step = "upload" | "review" | "details" | "success";

export function GuestApplicationWizard({ jobId, jobTitle, companyName }: GuestApplicationWizardProps) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    coverLetter: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const parseMutation = trpc.guestApplication.parseResume.useMutation({
    onSuccess: (data) => {
      setParsedData(data.parsedData);
      
      // Pre-fill form with parsed data
      setFormData(prev => ({
        ...prev,
        name: data.parsedData.personalInfo?.name || prev.name,
        email: data.parsedData.personalInfo?.email || prev.email,
        phoneNumber: data.parsedData.personalInfo?.phone || prev.phoneNumber,
      }));
      
      toast.success("Resume parsed successfully!");
      setCurrentStep("review");
    },
    onError: (error) => {
      toast.error(`Failed to parse resume: ${error.message}`);
    },
  });

  const submitMutation = trpc.guestApplication.submit.useMutation({
    onSuccess: () => {
      setCurrentStep("success");
      toast.success("Application submitted successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to submit application: ${error.message}`);
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
      toast.success("Resume selected. Click Continue to parse.");
    }
  };

  const handleUploadAndParse = async () => {
    if (!resumeFile) {
      toast.error("Please select a resume file");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        await parseMutation.mutateAsync({
          resumeBase64: base64,
          resumeFilename: resumeFile.name,
        });
      };
      reader.readAsDataURL(resumeFile);
    } catch (error: any) {
      toast.error(`Failed to process resume: ${error.message}`);
    }
  };

  const steps: Step[] = ["upload", "review", "details", "success"];
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (currentStep === "upload") {
      handleUploadAndParse();
      return;
    }

    if (currentStep === "review") {
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
        if (!formData.name) validationErrors.fullName = "Name is required";
        if (!formData.email) validationErrors.email = "Email is required";
      }
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        toast.error("Please fix the errors in the form");
        return;
      }
      
      setErrors({});
      handleSubmit();
      return;
    }

    if (currentStep === "success") {
      // Redirect to jobs page
      setLocation("/jobs");
      return;
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0 && currentStep !== "success") {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!resumeFile) {
      toast.error("Missing resume file");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        await submitMutation.mutateAsync({
          jobId,
          email: formData.email,
          name: formData.name,
          phoneNumber: formData.phoneNumber || undefined,
          coverLetter: formData.coverLetter || undefined,
          resumeFile: {
            data: base64.split(',')[1], // Remove data URL prefix
            filename: resumeFile.name,
            mimeType: resumeFile.type,
          },
          extendedInfo: {},
        });
      };
      reader.readAsDataURL(resumeFile);
    } catch (error: any) {
      toast.error(`Failed to submit application: ${error.message}`);
    }
  };

  const renderUploadStep = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Your Resume
          </CardTitle>
          <CardDescription>
            Upload your resume to apply for {jobTitle}
            {companyName && ` at ${companyName}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Click to upload resume
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  PDF or DOCX (max 5MB)
                </p>
              </div>
            </label>
          </div>

          {resumeFile && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-900">{resumeFile.name}</p>
                <p className="text-sm text-green-700">
                  {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Your resume will be parsed automatically using AI to extract your information. You'll have a chance to review and edit it before submitting.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderReviewStep = () => {
    if (!parsedData) return null;

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
              <strong>Note:</strong> You can edit the extracted information above. Click Continue to add additional details.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDetailsStep = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Additional Information
          </CardTitle>
          <CardDescription>
            Confirm your details and add an optional cover letter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@example.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className={errors.phoneNumber ? "border-red-500" : ""}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-500">{errors.phoneNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
              <Textarea
                id="coverLetter"
                value={formData.coverLetter}
                onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                placeholder="Tell us why you're interested in this position..."
                rows={6}
                className={errors.coverLetter ? "border-red-500" : ""}
              />
              {errors.coverLetter && (
                <p className="text-sm text-red-500">{errors.coverLetter}</p>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Privacy Notice:</strong> Your information will only be used for this job application and will be handled according to our privacy policy.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSuccessStep = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            Application Submitted!
          </CardTitle>
          <CardDescription>
            Your application has been successfully submitted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-green-900">
                  Thank you for applying!
                </h3>
                <p className="text-sm text-green-700">
                  We've received your application for {jobTitle}
                </p>
              </div>
            </div>

            <div className="border-t border-green-200 pt-4 space-y-2">
              <p className="text-sm text-gray-700">
                <strong>What's next?</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Our team will review your application</li>
                <li>You'll receive an email confirmation shortly</li>
                <li>We'll contact you if your profile matches our requirements</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Application Details:</strong>
            </p>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p><strong>Name:</strong> {formData.name}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              {formData.phoneNumber && (
                <p><strong>Phone:</strong> {formData.phoneNumber}</p>
              )}
              <p><strong>Resume:</strong> {resumeFile?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStepIndex === index;
            const isCompleted = currentStepIndex > index;
            
            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium capitalize ${
                      isActive ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded ${
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-6">
        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "review" && renderReviewStep()}
        {currentStep === "details" && renderDetailsStep()}
        {currentStep === "success" && renderSuccessStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0 || currentStep === "success" || parseMutation.isPending || submitMutation.isPending}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={parseMutation.isPending || submitMutation.isPending}
        >
          {parseMutation.isPending || submitMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {parseMutation.isPending ? "Parsing..." : "Submitting..."}
            </>
          ) : currentStep === "success" ? (
            <>
              Browse More Jobs
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : currentStep === "details" ? (
            <>
              Submit Application
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
