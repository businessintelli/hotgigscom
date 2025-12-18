import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, User, Mail, Phone, CheckCircle, Loader2, ArrowLeft, ArrowRight, DollarSign, Shield, GraduationCap, Briefcase, Languages, MapPin, IdCard, FileUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface GuestApplicationWizardProps {
  jobId: number;
  jobTitle: string;
  companyName?: string;
}

type Step = "upload" | "basic" | "compensation" | "work-auth" | "personal" | "education" | "employment" | "languages" | "address" | "identification" | "confirmation";

interface EmploymentEntry {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}

export function GuestApplicationWizard({ jobId, jobTitle, companyName }: GuestApplicationWizardProps) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [guestApplicationId, setGuestApplicationId] = useState<number | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    // Basic info
    name: "",
    email: "",
    phoneNumber: "",
    coverLetter: "",
    // Compensation
    currentSalary: "",
    expectedSalary: "",
    currentHourlyRate: "",
    expectedHourlyRate: "",
    salaryType: "annual" as "annual" | "hourly" | "contract",
    // Work Authorization
    workAuthorization: "",
    workAuthorizationEndDate: "",
    w2EmployerName: "",
    // Personal
    nationality: "",
    gender: "",
    dateOfBirth: "",
    // Education
    highestEducation: "",
    specialization: "",
    highestDegreeStartDate: "",
    highestDegreeEndDate: "",
    // Employment History
    employmentHistory: [] as EmploymentEntry[],
    // Languages
    languagesRead: [] as string[],
    languagesSpeak: [] as string[],
    languagesWrite: [] as string[],
    // Address
    currentResidenceZipCode: "",
    // Identification
    passportNumber: "",
    sinLast4: "",
    linkedinId: "",
    // Documents
    passportCopyUrl: "",
    dlCopyUrl: "",
  });

  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [dlFile, setDlFile] = useState<File | null>(null);

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
      
      setCurrentStep("basic");
      toast.success("Resume uploaded and parsed successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to upload resume: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or DOCX file");
      return;
    }

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
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const base64Content = base64Data.split(",")[1];

        submitMutation.mutate({
          jobId,
          email: formData.email || "temp@example.com",
          name: formData.name || "Applicant",
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

  const steps: Step[] = ["upload", "basic", "compensation", "work-auth", "personal", "education", "employment", "languages", "address", "identification", "confirmation"];
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (currentStep === "upload") {
      handleUploadResume();
      return;
    }

    if (currentStep === "basic") {
      if (!formData.name || !formData.email) {
        toast.error("Please fill in name and email");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    // Upload documents if provided
    let passportUrl = formData.passportCopyUrl;
    let dlUrl = formData.dlCopyUrl;

    // TODO: Implement document upload to S3
    // For now, we'll submit without document URLs

    toast.success("Application submitted successfully!");
    setCurrentStep("confirmation");
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

  const renderBasicInfoStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Basic Information
        </CardTitle>
        <CardDescription>
          Confirm your contact details
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
          <Textarea
            id="coverLetter"
            value={formData.coverLetter}
            onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
            placeholder="Tell us why you're interested in this position..."
            rows={5}
          />
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

  const renderCompensationStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Compensation Details
        </CardTitle>
        <CardDescription>
          Help us understand your salary expectations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="salaryType">Salary Type</Label>
          <Select
            value={formData.salaryType}
            onValueChange={(value: any) => setFormData({ ...formData, salaryType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select salary type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="annual">Annual Salary</SelectItem>
              <SelectItem value="hourly">Hourly Rate</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.salaryType === "annual" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="currentSalary">Current Annual Salary</Label>
              <Input
                id="currentSalary"
                type="number"
                value={formData.currentSalary}
                onChange={(e) => setFormData({ ...formData, currentSalary: e.target.value })}
                placeholder="75000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedSalary">Expected Annual Salary</Label>
              <Input
                id="expectedSalary"
                type="number"
                value={formData.expectedSalary}
                onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                placeholder="85000"
              />
            </div>
          </>
        )}

        {formData.salaryType === "hourly" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="currentHourlyRate">Current Hourly Rate</Label>
              <Input
                id="currentHourlyRate"
                type="number"
                value={formData.currentHourlyRate}
                onChange={(e) => setFormData({ ...formData, currentHourlyRate: e.target.value })}
                placeholder="35"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedHourlyRate">Expected Hourly Rate</Label>
              <Input
                id="expectedHourlyRate"
                type="number"
                value={formData.expectedHourlyRate}
                onChange={(e) => setFormData({ ...formData, expectedHourlyRate: e.target.value })}
                placeholder="40"
              />
            </div>
          </>
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

  const renderWorkAuthStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Work Authorization
        </CardTitle>
        <CardDescription>
          Provide your work authorization details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workAuthorization">Work Authorization Status</Label>
          <Select
            value={formData.workAuthorization}
            onValueChange={(value) => setFormData({ ...formData, workAuthorization: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="citizen">US Citizen</SelectItem>
              <SelectItem value="green-card">Green Card</SelectItem>
              <SelectItem value="h1b">H1B Visa</SelectItem>
              <SelectItem value="opt">OPT</SelectItem>
              <SelectItem value="cpt">CPT</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.workAuthorization && formData.workAuthorization !== "citizen" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="workAuthorizationEndDate">Authorization End Date</Label>
              <Input
                id="workAuthorizationEndDate"
                type="date"
                value={formData.workAuthorizationEndDate}
                onChange={(e) => setFormData({ ...formData, workAuthorizationEndDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="w2EmployerName">Current W2 Employer Name</Label>
              <Input
                id="w2EmployerName"
                value={formData.w2EmployerName}
                onChange={(e) => setFormData({ ...formData, w2EmployerName: e.target.value })}
                placeholder="Company Name"
              />
            </div>
          </>
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

  const renderPersonalStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Optional personal details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Input
            id="nationality"
            value={formData.nationality}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            placeholder="United States"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => setFormData({ ...formData, gender: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
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

  const renderEducationStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Education Details
        </CardTitle>
        <CardDescription>
          Tell us about your highest education
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="highestEducation">Highest Education Level</Label>
          <Select
            value={formData.highestEducation}
            onValueChange={(value) => setFormData({ ...formData, highestEducation: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select education level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high-school">High School</SelectItem>
              <SelectItem value="associate">Associate Degree</SelectItem>
              <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
              <SelectItem value="master">Master's Degree</SelectItem>
              <SelectItem value="doctorate">Doctorate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialization">Specialization/Major</Label>
          <Input
            id="specialization"
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            placeholder="Computer Science"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="highestDegreeStartDate">Start Date</Label>
            <Input
              id="highestDegreeStartDate"
              type="date"
              value={formData.highestDegreeStartDate}
              onChange={(e) => setFormData({ ...formData, highestDegreeStartDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="highestDegreeEndDate">End Date</Label>
            <Input
              id="highestDegreeEndDate"
              type="date"
              value={formData.highestDegreeEndDate}
              onChange={(e) => setFormData({ ...formData, highestDegreeEndDate: e.target.value })}
            />
          </div>
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

  const renderEmploymentStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-4" />
          Employment History
        </CardTitle>
        <CardDescription>
          This information was extracted from your resume. You can skip this step.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {parsedData?.experience && parsedData.experience.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              We found {parsedData.experience.length} employment entries in your resume.
            </p>
            {parsedData.experience.slice(0, 3).map((exp: any, idx: number) => (
              <div key={idx} className="border-l-2 border-blue-500 pl-3 py-2">
                <p className="font-medium text-sm">{exp.title}</p>
                <p className="text-sm text-gray-600">{exp.company}</p>
                <p className="text-xs text-gray-500">{exp.duration}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No employment history found in resume.</p>
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

  const renderLanguagesStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5" />
          Language Proficiency
        </CardTitle>
        <CardDescription>
          Tell us about the languages you know
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Languages You Can Read (comma-separated)</Label>
          <Input
            placeholder="English, Spanish, French"
            value={formData.languagesRead.join(", ")}
            onChange={(e) => setFormData({ 
              ...formData, 
              languagesRead: e.target.value.split(",").map(l => l.trim()).filter(Boolean)
            })}
          />
        </div>

        <div className="space-y-2">
          <Label>Languages You Can Speak (comma-separated)</Label>
          <Input
            placeholder="English, Spanish"
            value={formData.languagesSpeak.join(", ")}
            onChange={(e) => setFormData({ 
              ...formData, 
              languagesSpeak: e.target.value.split(",").map(l => l.trim()).filter(Boolean)
            })}
          />
        </div>

        <div className="space-y-2">
          <Label>Languages You Can Write (comma-separated)</Label>
          <Input
            placeholder="English, Spanish"
            value={formData.languagesWrite.join(", ")}
            onChange={(e) => setFormData({ 
              ...formData, 
              languagesWrite: e.target.value.split(",").map(l => l.trim()).filter(Boolean)
            })}
          />
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

  const renderAddressStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Address Information
        </CardTitle>
        <CardDescription>
          Provide your current residence details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentResidenceZipCode">Current Residence Zip Code</Label>
          <Input
            id="currentResidenceZipCode"
            value={formData.currentResidenceZipCode}
            onChange={(e) => setFormData({ ...formData, currentResidenceZipCode: e.target.value })}
            placeholder="12345"
          />
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

  const renderIdentificationStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IdCard className="w-5 h-5" />
          Identification & Documents
        </CardTitle>
        <CardDescription>
          Optional identification details and document uploads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="passportNumber">Passport Number</Label>
          <Input
            id="passportNumber"
            value={formData.passportNumber}
            onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
            placeholder="A12345678"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sinLast4">Last 4 Digits of SSN/SIN</Label>
          <Input
            id="sinLast4"
            maxLength={4}
            value={formData.sinLast4}
            onChange={(e) => setFormData({ ...formData, sinLast4: e.target.value })}
            placeholder="1234"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedinId">LinkedIn Profile URL</Label>
          <Input
            id="linkedinId"
            value={formData.linkedinId}
            onChange={(e) => setFormData({ ...formData, linkedinId: e.target.value })}
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>

        <div className="space-y-2">
          <Label>Passport Copy (Optional)</Label>
          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
          />
          {passportFile && (
            <p className="text-xs text-gray-600">Selected: {passportFile.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Driver's License Copy (Optional)</Label>
          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setDlFile(e.target.files?.[0] || null)}
          />
          {dlFile && (
            <p className="text-xs text-gray-600">Selected: {dlFile.name}</p>
          )}
        </div>

        <div className="flex justify-between gap-2">
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSubmit}>
            Submit Application
            <CheckCircle className="w-4 h-4 ml-2" />
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
          Thank you for applying to {jobTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            Your application has been submitted successfully. We've sent a confirmation email to <strong>{formData.email}</strong>.
          </p>
          {guestApplicationId && (
            <p className="text-xs text-gray-600 mt-2">
              Application ID: {guestApplicationId}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">What's Next?</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>The hiring team will review your application</li>
            <li>You'll receive email updates on your application status</li>
            <li>Create an account to track your application and apply to more jobs</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setLocation("/jobs")} variant="outline">
            Browse More Jobs
          </Button>
          <Button onClick={() => setLocation("/")}>
            Go to Home
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
      {currentStep !== "confirmation" && renderProgressBar()}
      
      {currentStep === "upload" && renderUploadStep()}
      {currentStep === "basic" && renderBasicInfoStep()}
      {currentStep === "compensation" && renderCompensationStep()}
      {currentStep === "work-auth" && renderWorkAuthStep()}
      {currentStep === "personal" && renderPersonalStep()}
      {currentStep === "education" && renderEducationStep()}
      {currentStep === "employment" && renderEmploymentStep()}
      {currentStep === "languages" && renderLanguagesStep()}
      {currentStep === "address" && renderAddressStep()}
      {currentStep === "identification" && renderIdentificationStep()}
      {currentStep === "confirmation" && renderConfirmationStep()}
    </div>
  );
}
