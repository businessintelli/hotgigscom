import { useState, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Code
} from "lucide-react";
import ExtendedCandidateInfoForm, { ExtendedCandidateInfo } from "@/components/ExtendedCandidateInfoForm";

interface ParsedResume {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  summary?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  totalExperienceYears?: number;
  seniorityLevel?: string;
}

export default function ApplyOnBehalf() {
  const [, params] = useRoute("/recruiter/apply-on-behalf/:jobId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const jobId = parseInt(params?.jobId || "0");
  const [mode, setMode] = useState<"select" | "upload" | "candidate-select">("select"); // New: mode selection
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [step, setStep] = useState<"upload" | "review" | "submit" | "success">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [candidateData, setCandidateData] = useState<ParsedResume | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [returnUrl, setReturnUrl] = useState("/recruiter/applications");
  const [extendedInfo, setExtendedInfo] = useState<ExtendedCandidateInfo>({});

  const { data: job } = trpc.job.getById.useQuery({ id: jobId }, { enabled: !!jobId });
  const { data: candidates = [] } = trpc.candidate.searchCandidates.useQuery(
    { query: "", limit: 100 },
    { enabled: mode === "candidate-select" }
  );
  const { data: selectedCandidate } = trpc.candidate.getById.useQuery(
    { id: selectedCandidateId || 0 },
    { enabled: !!selectedCandidateId }
  );
  const parseResumeMutation = trpc.application.parseResumeForRecruiter.useMutation();
  const submitMutation = trpc.application.submitOnBehalf.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleParseResume = async () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (!base64) return;

      try {
        const result = await parseResumeMutation.mutateAsync({
          resumeFile: {
            data: base64,
            filename: selectedFile.name,
            mimeType: selectedFile.type,
          },
        });

        if (result.success && result.parsedData) {
          setParsedData(result.parsedData);
          setCandidateData(result.parsedData);
          setStep("review");
          toast({
            title: "Resume parsed successfully",
            description: "Please review and edit the extracted information",
          });
        } else {
          toast({
            title: "Parsing failed",
            description: result.error || "Failed to parse resume",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to parse resume",
          variant: "destructive",
        });
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmitApplication = async () => {
    if (!candidateData || !selectedFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (!base64) return;

      try {
        const result = await submitMutation.mutateAsync({
          jobId,
          resumeFile: {
            data: base64,
            filename: selectedFile.name,
            mimeType: selectedFile.type,
          },
          candidateData: {
            name: candidateData.personalInfo.name,
            email: candidateData.personalInfo.email,
            phone: candidateData.personalInfo.phone || '',
            location: candidateData.personalInfo.location || '',
            skills: candidateData.skills,
            experience: candidateData.experience,
            education: candidateData.education,
            totalExperienceYears: candidateData.totalExperienceYears,
            seniorityLevel: candidateData.seniorityLevel,
          },
          coverLetter,
          returnUrl,
          extendedInfo,
        });

        if (result.success) {
          setStep("success");
          toast({
            title: "Application submitted",
            description: result.isNewCandidate 
              ? "Candidate created and application submitted. An invitation email will be sent."
              : "Application submitted successfully",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to submit application",
          variant: "destructive",
        });
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const updateCandidateField = (field: string, value: any) => {
    if (!candidateData) return;
    
    if (field.startsWith('personalInfo.')) {
      const subField = field.split('.')[1];
      setCandidateData({
        ...candidateData,
        personalInfo: {
          ...candidateData.personalInfo,
          [subField]: value,
        },
      });
    } else {
      setCandidateData({
        ...candidateData,
        [field]: value,
      });
    }
  };

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => setLocation(returnUrl)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Apply on Behalf of Candidate</CardTitle>
            <CardDescription>
              Submitting application for: <strong>{job.title}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mode Selection */}
            {mode === "select" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">How would you like to proceed?</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card 
                      className="cursor-pointer hover:border-blue-600 transition-colors"
                      onClick={() => setMode("upload")}
                    >
                      <CardHeader>
                        <Upload className="w-8 h-8 mb-2 text-blue-600" />
                        <CardTitle className="text-lg">Upload New Resume</CardTitle>
                        <CardDescription>
                          Upload a resume file and we'll extract candidate information
                        </CardDescription>
                      </CardHeader>
                    </Card>
                    <Card 
                      className="cursor-pointer hover:border-blue-600 transition-colors"
                      onClick={() => setMode("candidate-select")}
                    >
                      <CardHeader>
                        <User className="w-8 h-8 mb-2 text-blue-600" />
                        <CardTitle className="text-lg">Select Existing Candidate</CardTitle>
                        <CardDescription>
                          Choose from your candidate database with pre-filled information
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* Candidate Selection */}
            {mode === "candidate-select" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Select Candidate</h3>
                  <Button variant="outline" onClick={() => setMode("select")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {candidates.map((candidate: any) => (
                    <Card 
                      key={candidate.id}
                      className={`cursor-pointer hover:border-blue-600 transition-colors ${
                        selectedCandidateId === candidate.id ? "border-blue-600 bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        setSelectedCandidateId(candidate.id);
                        // Auto-fill data from selected candidate
                        if (candidate) {
                          setCandidateData({
                            personalInfo: {
                              name: candidate.user?.name || "",
                              email: candidate.user?.email || "",
                              phone: candidate.phoneNumber || "",
                              location: candidate.location || "",
                              linkedin: candidate.linkedinUrl || "",
                              github: candidate.githubUrl || "",
                            },
                            summary: candidate.bio || "",
                            skills: candidate.skills ? JSON.parse(candidate.skills) : [],
                            experience: candidate.experience ? JSON.parse(candidate.experience) : [],
                            education: candidate.education ? JSON.parse(candidate.education) : [],
                            totalExperienceYears: candidate.totalExperienceYears || 0,
                            seniorityLevel: candidate.seniorityLevel || "",
                          });
                          
                          // Auto-fill extended info
                          const autoFilledInfo: ExtendedCandidateInfo = {};
                          if (candidate.workAuthorization) autoFilledInfo.workAuthorization = candidate.workAuthorization;
                          if (candidate.workAuthorizationEndDate) autoFilledInfo.workAuthorizationEndDate = new Date(candidate.workAuthorizationEndDate).toISOString().split('T')[0];
                          if (candidate.w2EmployerName) autoFilledInfo.w2EmployerName = candidate.w2EmployerName;
                          if (candidate.nationality) autoFilledInfo.nationality = candidate.nationality;
                          if (candidate.gender) autoFilledInfo.gender = candidate.gender;
                          if (candidate.dateOfBirth) autoFilledInfo.dateOfBirth = new Date(candidate.dateOfBirth).toISOString().split('T')[0];
                          if (candidate.highestEducation) autoFilledInfo.highestEducation = candidate.highestEducation;
                          if (candidate.specialization) autoFilledInfo.specialization = candidate.specialization;
                          if (candidate.highestDegreeStartDate) autoFilledInfo.highestDegreeStartDate = new Date(candidate.highestDegreeStartDate).toISOString().split('T')[0];
                          if (candidate.highestDegreeEndDate) autoFilledInfo.highestDegreeEndDate = new Date(candidate.highestDegreeEndDate).toISOString().split('T')[0];
                          if (candidate.employmentHistory) autoFilledInfo.employmentHistory = JSON.parse(candidate.employmentHistory);
                          if (candidate.languagesRead) autoFilledInfo.languagesRead = JSON.parse(candidate.languagesRead);
                          if (candidate.languagesSpeak) autoFilledInfo.languagesSpeak = JSON.parse(candidate.languagesSpeak);
                          if (candidate.languagesWrite) autoFilledInfo.languagesWrite = JSON.parse(candidate.languagesWrite);
                          if (candidate.currentResidenceZipCode) autoFilledInfo.currentResidenceZipCode = candidate.currentResidenceZipCode;
                          if (candidate.passportNumber) autoFilledInfo.passportNumber = candidate.passportNumber;
                          if (candidate.sinLast4) autoFilledInfo.sinLast4 = candidate.sinLast4;
                          if (candidate.linkedinId) autoFilledInfo.linkedinId = candidate.linkedinId;
                          if (candidate.passportCopyUrl) autoFilledInfo.passportCopyUrl = candidate.passportCopyUrl;
                          if (candidate.dlCopyUrl) autoFilledInfo.dlCopyUrl = candidate.dlCopyUrl;
                          if (candidate.currentSalary) autoFilledInfo.currentSalary = candidate.currentSalary;
                          if (candidate.currentHourlyRate) autoFilledInfo.currentHourlyRate = candidate.currentHourlyRate;
                          if (candidate.expectedSalary) autoFilledInfo.expectedSalary = candidate.expectedSalary;
                          if (candidate.expectedHourlyRate) autoFilledInfo.expectedHourlyRate = candidate.expectedHourlyRate;
                          if (candidate.salaryType) autoFilledInfo.salaryType = candidate.salaryType as 'salary' | 'hourly';
                          
                          setExtendedInfo(autoFilledInfo);
                          setStep("review");
                          setMode("upload"); // Move to review mode
                          
                          toast({
                            title: "Candidate selected",
                            description: "Profile information has been auto-filled. Please review and submit.",
                          });
                        }
                      }}
                    >
                      <CardHeader className="py-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{candidate.user?.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {candidate.user?.email} • {candidate.phoneNumber || "No phone"}
                            </CardDescription>
                            {candidate.title && (
                              <p className="text-sm text-gray-600 mt-1">{candidate.title}</p>
                            )}
                          </div>
                          {selectedCandidateId === candidate.id && (
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                  {candidates.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No candidates found</p>
                  )}
                </div>
              </div>
            )}

            {/* Progress Steps */}
            {mode === "upload" && (
            <>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "upload" ? "bg-blue-600 text-white" : "bg-green-600 text-white"
                }`}>
                  {step === "upload" ? "1" : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <span className="text-sm font-medium">Upload Resume</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div className={`h-full ${step !== "upload" ? "bg-green-600" : "bg-gray-200"}`} />
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "review" ? "bg-blue-600 text-white" : 
                  step === "submit" || step === "success" ? "bg-green-600 text-white" : "bg-gray-200"
                }`}>
                  {step === "submit" || step === "success" ? <CheckCircle2 className="w-5 h-5" /> : "2"}
                </div>
                <span className="text-sm font-medium">Review & Edit</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div className={`h-full ${step === "submit" || step === "success" ? "bg-green-600" : "bg-gray-200"}`} />
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "submit" ? "bg-blue-600 text-white" : 
                  step === "success" ? "bg-green-600 text-white" : "bg-gray-200"
                }`}>
                  {step === "success" ? <CheckCircle2 className="w-5 h-5" /> : "3"}
                </div>
                <span className="text-sm font-medium">Submit</span>
              </div>
            </div>

            {/* Step 1: Upload Resume */}
            {step === "upload" && (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="space-y-4">
                      <FileText className="w-16 h-16 text-green-600 mx-auto" />
                      <div>
                        <p className="font-medium text-lg">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose Different File
                        </Button>
                        <Button
                          onClick={handleParseResume}
                          disabled={parseResumeMutation.isPending}
                        >
                          {parseResumeMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Parsing Resume...
                            </>
                          ) : (
                            <>
                              Parse Resume
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium">Upload Candidate Resume</p>
                        <p className="text-sm text-gray-600">PDF or DOCX, max 10MB</p>
                      </div>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        Select File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Review & Edit */}
            {step === "review" && candidateData && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Review the extracted information below. You can edit any field before submitting.
                  </p>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={candidateData.personalInfo.name}
                        onChange={(e) => updateCandidateField('personalInfo.name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={candidateData.personalInfo.email}
                        onChange={(e) => updateCandidateField('personalInfo.email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={candidateData.personalInfo.phone || ''}
                        onChange={(e) => updateCandidateField('personalInfo.phone', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={candidateData.personalInfo.location || ''}
                        onChange={(e) => updateCandidateField('personalInfo.location', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {candidateData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add skills (comma-separated)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value.trim();
                        if (value) {
                          updateCandidateField('skills', [...candidateData.skills, value]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>

                {/* Experience */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Experience ({candidateData.totalExperienceYears || 0} years total)
                  </h3>
                  {candidateData.experience.map((exp, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <p className="font-medium">{exp.title}</p>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                        <p className="text-xs text-gray-500">
                          {exp.startDate} - {exp.endDate || 'Present'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Education */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Education
                  </h3>
                  {candidateData.education.map((edu, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <p className="font-medium">{edu.degree}</p>
                        <p className="text-sm text-gray-600">{edu.institution}</p>
                        <p className="text-xs text-gray-500">{edu.year}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setStep("upload")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={() => {
                      // Validate required fields before proceeding
                      if (!candidateData.personalInfo.name || !candidateData.personalInfo.email || 
                          !candidateData.personalInfo.phone || !candidateData.personalInfo.location) {
                        toast({
                          title: "Missing required fields",
                          description: "Please fill in all required fields: Name, Email, Phone, and Location",
                          variant: "destructive",
                        });
                        return;
                      }
                      setStep("submit");
                    }}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Submit */}
            {step === "submit" && candidateData && (
              <div className="space-y-6">
                {/* Extended Candidate Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Additional Information Required</h3>
                  <ExtendedCandidateInfoForm
                    data={extendedInfo}
                    onChange={setExtendedInfo}
                  />
                </div>

                <div>
                  <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                  <Textarea
                    id="coverLetter"
                    rows={6}
                    placeholder="Add a cover letter for this application..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Application Summary</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Candidate:</strong> {candidateData.personalInfo.name}</p>
                    <p><strong>Email:</strong> {candidateData.personalInfo.email}</p>
                    <p><strong>Job:</strong> {job.title}</p>
                    <p><strong>Skills:</strong> {candidateData.skills.length} skills</p>
                    <p><strong>Experience:</strong> {candidateData.totalExperienceYears || 0} years</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setStep("review")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmitApplication}
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Success */}
            {step === "success" && (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Application Submitted!</h3>
                <p className="text-gray-600 mb-6">
                  The candidate will receive an email invitation to register and review their application.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setLocation(`/recruiter/jobs/${jobId}`)}>
                    View Job
                  </Button>
                  <Button onClick={() => setLocation(returnUrl)}>
                    Back to Applications
                  </Button>
                </div>
              </div>
            )}
            </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
