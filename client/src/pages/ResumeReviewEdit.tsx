import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ArrowLeft, ArrowRight, Upload, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ParsedResume {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    nationality?: string;
    gender?: string;
    dateOfBirth?: string;
    passportNumber?: string;
    linkedinId?: string;
  };
  summary?: string;
  skills: string[];
  experience: Array<{
    title?: string;
    company?: string;
    location?: string;
    address?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    duration?: string;
  }>;
  education: Array<{
    degree?: string;
    institution?: string;
    location?: string;
    graduationDate?: string;
    gpa?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
  }>;
  certifications?: string[];
  languages?: {
    read?: string[];
    speak?: string[];
    write?: string[];
  };
  projects?: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
  compensation?: {
    currentSalary?: number | null;
    expectedSalary?: number | null;
    currentHourlyRate?: number | null;
    expectedHourlyRate?: number | null;
    salaryType?: 'salary' | 'hourly';
  };
  workAuthorization?: {
    status?: string;
    endDate?: string;
    w2EmployerName?: string;
  };
  address?: {
    zipCode?: string;
  };
  metadata?: {
    totalExperienceYears?: number;
    seniorityLevel?: string;
    primaryDomain?: string;
    skillCategories?: Record<string, string[]>;
  };
}

const WIZARD_STEPS = [
  { id: 1, title: "Personal Information", icon: "👤" },
  { id: 2, title: "Professional Summary & Skills", icon: "💼" },
  { id: 3, title: "Work Experience", icon: "🏢" },
  { id: 4, title: "Education", icon: "🎓" },
  { id: 5, title: "Additional Information", icon: "📋" },
  { id: 6, title: "Review & Submit", icon: "✅" },
];

const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "German", "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Portuguese", "Russian", "Italian"];

export default function ResumeReviewEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [editedData, setEditedData] = useState<ParsedResume | null>(null);
  const [resumeMetadata, setResumeMetadata] = useState<any>(null);
  const [newSkill, setNewSkill] = useState("");

  // Get data from sessionStorage
  useEffect(() => {
    const storedData = sessionStorage.getItem('resumeReviewData');
    if (storedData) {
      const state = JSON.parse(storedData);
      // Clear the sessionStorage after reading
      sessionStorage.removeItem('resumeReviewData');
      
      if (state?.parsedData) {
        // Initialize with defaults if fields are missing
        const parsedData = state.parsedData;
      setEditedData({
        ...parsedData,
        personalInfo: parsedData.personalInfo || {},
        skills: parsedData.skills || [],
        experience: parsedData.experience || [],
        education: parsedData.education || [],
        certifications: parsedData.certifications || [],
        languages: parsedData.languages || { read: [], speak: [], write: [] },
        projects: parsedData.projects || [],
        compensation: parsedData.compensation || {
          currentSalary: null,
          expectedSalary: null,
          currentHourlyRate: null,
          expectedHourlyRate: null,
          salaryType: 'salary',
        },
        workAuthorization: parsedData.workAuthorization || {},
        address: parsedData.address || {},
      });
      setResumeMetadata({
        resumeUrl: state.resumeUrl,
        fileKey: state.fileKey,
        fileName: state.fileName,
        profileName: state.profileName,
        isDefault: state.isDefault,
        candidateId: state.candidateId,
        scores: state.scores,
      });
      }
    } else {
      // No data found, redirect back to my-resumes after a brief moment
      const timer = setTimeout(() => {
        toast({
          title: "No resume data found",
          description: "Please upload a resume first",
          variant: "destructive",
        });
        setLocation('/candidate/my-resumes');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [setLocation, toast]);

  const saveProfileMutation = trpc.resumeProfile.saveResumeProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Resume saved successfully! 🎉",
        description: "Your resume has been saved to your profile",
      });
      setLocation("/candidate/my-resumes");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save resume",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!editedData || !resumeMetadata) return;

    saveProfileMutation.mutate({
      candidateId: resumeMetadata.candidateId,
      profileName: resumeMetadata.profileName,
      resumeUrl: resumeMetadata.resumeUrl,
      fileKey: resumeMetadata.fileKey,
      fileName: resumeMetadata.fileName,
      parsedData: editedData,
      isDefault: resumeMetadata.isDefault,
    });
  };

  const addSkill = () => {
    if (!newSkill.trim() || !editedData) return;
    setEditedData({
      ...editedData,
      skills: [...editedData.skills, newSkill.trim()],
    });
    setNewSkill("");
  };

  const removeSkill = (index: number) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      skills: editedData.skills.filter((_, i) => i !== index),
    });
  };

  const addExperience = () => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      experience: [
        ...editedData.experience,
        { title: "", company: "", location: "", startDate: "", endDate: "", description: "" },
      ],
    });
  };

  const removeExperience = (index: number) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      experience: editedData.experience.filter((_, i) => i !== index),
    });
  };

  const updateExperience = (index: number, field: string, value: string) => {
    if (!editedData) return;
    const newExperience = [...editedData.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    setEditedData({ ...editedData, experience: newExperience });
  };

  const addEducation = () => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      education: [
        ...editedData.education,
        { degree: "", institution: "", fieldOfStudy: "", graduationDate: "" },
      ],
    });
  };

  const removeEducation = (index: number) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      education: editedData.education.filter((_, i) => i !== index),
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    if (!editedData) return;
    const newEducation = [...editedData.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setEditedData({ ...editedData, education: newEducation });
  };

  const toggleLanguage = (category: 'read' | 'speak' | 'write', language: string) => {
    if (!editedData || !editedData.languages) return;
    const current = editedData.languages[category] || [];
    const updated = current.includes(language)
      ? current.filter(l => l !== language)
      : [...current, language];
    setEditedData({
      ...editedData,
      languages: { ...editedData.languages, [category]: updated },
    });
  };

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!editedData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading resume data...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentStep / WIZARD_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Review & Edit Your Resume</h1>
          </div>
          <p className="text-gray-600">
            Step {currentStep} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep - 1].title}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between mt-4">
            {WIZARD_STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  step.id === currentStep ? 'text-primary font-semibold' : 'text-gray-400'
                } ${step.id < currentStep ? 'text-green-600' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                    step.id === currentStep
                      ? 'bg-primary text-white'
                      : step.id < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  {step.id < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                </div>
                <span className="text-xs hidden md:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic contact details and personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={editedData.personalInfo.name || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, name: e.target.value },
                        })
                      }
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={editedData.personalInfo.email || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, email: e.target.value },
                        })
                      }
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={editedData.personalInfo.phone || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, phone: e.target.value },
                        })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={editedData.personalInfo.location || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, location: e.target.value },
                        })
                      }
                      placeholder="San Francisco, CA"
                    />
                  </div>
                  <div>
                    <Label>Current Residence Zip Code</Label>
                    <Input
                      value={editedData.address?.zipCode || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          address: { ...editedData.address, zipCode: e.target.value },
                        })
                      }
                      placeholder="e.g., 10001"
                    />
                  </div>
                  <div>
                    <Label>LinkedIn ID</Label>
                    <Input
                      value={editedData.personalInfo.linkedinId || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, linkedinId: e.target.value },
                        })
                      }
                      placeholder="e.g., linkedin.com/in/yourname"
                    />
                  </div>
                  <div>
                    <Label>GitHub</Label>
                    <Input
                      value={editedData.personalInfo.github || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, github: e.target.value },
                        })
                      }
                      placeholder="github.com/username"
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select
                      value={editedData.personalInfo.gender || ""}
                      onValueChange={(value) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, gender: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date of Birth (MM/DD/YYYY)</Label>
                    <Input
                      type="date"
                      value={editedData.personalInfo.dateOfBirth || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, dateOfBirth: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Nationality</Label>
                    <Input
                      value={editedData.personalInfo.nationality || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, nationality: e.target.value },
                        })
                      }
                      placeholder="e.g., American, Indian, Chinese"
                    />
                  </div>
                  <div>
                    <Label>Passport Number</Label>
                    <Input
                      value={editedData.personalInfo.passportNumber || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          personalInfo: { ...editedData.personalInfo, passportNumber: e.target.value },
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Professional Summary & Skills */}
          {currentStep === 2 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Professional Summary</CardTitle>
                  <CardDescription>A brief overview of your professional background</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editedData.summary || ""}
                    onChange={(e) => setEditedData({ ...editedData, summary: e.target.value })}
                    rows={5}
                    placeholder="Experienced software engineer with 5+ years in full-stack development..."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                  <CardDescription>Add or remove your technical and professional skills</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill (e.g., JavaScript, Project Management)"
                      onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    />
                    <Button onClick={addSkill} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editedData.skills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground px-3 py-1"
                        onClick={() => removeSkill(index)}
                      >
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Step 3: Work Experience */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
                <CardDescription>Your employment history and responsibilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {editedData.experience.map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Position {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(index)}
                        className="text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Job Title</Label>
                        <Input
                          value={exp.title || ""}
                          onChange={(e) => updateExperience(index, "title", e.target.value)}
                          placeholder="Software Engineer"
                        />
                      </div>
                      <div>
                        <Label>Company</Label>
                        <Input
                          value={exp.company || ""}
                          onChange={(e) => updateExperience(index, "company", e.target.value)}
                          placeholder="Tech Corp"
                        />
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Input
                          value={exp.location || ""}
                          onChange={(e) => updateExperience(index, "location", e.target.value)}
                          placeholder="San Francisco, CA"
                        />
                      </div>
                      <div>
                        <Label>Company Address (Full)</Label>
                        <Input
                          value={exp.address || ""}
                          onChange={(e) => updateExperience(index, "address", e.target.value)}
                          placeholder="123 Main St, San Francisco, CA 94102"
                        />
                      </div>
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={exp.startDate || ""}
                          onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={exp.endDate || ""}
                          onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                          placeholder="Leave empty if current"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={exp.description || ""}
                        onChange={(e) => updateExperience(index, "description", e.target.value)}
                        rows={3}
                        placeholder="Describe your responsibilities and achievements..."
                      />
                    </div>
                  </div>
                ))}
                <Button onClick={addExperience} variant="outline" className="w-full">
                  + Add Employment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Education */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
                <CardDescription>Your academic background and qualifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {editedData.education.map((edu, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Education {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(index)}
                        className="text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Highest Education Level</Label>
                        <Select
                          value={edu.degree || ""}
                          onValueChange={(value) => updateEducation(index, "degree", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select education level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high-school">High School</SelectItem>
                            <SelectItem value="associate">Associate Degree</SelectItem>
                            <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                            <SelectItem value="master">Master's Degree</SelectItem>
                            <SelectItem value="phd">PhD</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Institution</Label>
                        <Input
                          value={edu.institution || ""}
                          onChange={(e) => updateEducation(index, "institution", e.target.value)}
                          placeholder="University Name"
                        />
                      </div>
                      <div>
                        <Label>Specialization/Field of Study</Label>
                        <Input
                          value={edu.fieldOfStudy || ""}
                          onChange={(e) => updateEducation(index, "fieldOfStudy", e.target.value)}
                          placeholder="e.g., Computer Science, Business"
                        />
                      </div>
                      <div>
                        <Label>Start Date (MM/DD/YYYY)</Label>
                        <Input
                          type="date"
                          value={edu.startDate || ""}
                          onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>End Date (MM/DD/YYYY)</Label>
                        <Input
                          type="date"
                          value={edu.endDate || ""}
                          onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>GPA (Optional)</Label>
                        <Input
                          value={edu.gpa || ""}
                          onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                          placeholder="3.8"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button onClick={addEducation} variant="outline" className="w-full">
                  + Add Education
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Additional Information */}
          {currentStep === 5 && (
            <>
              {/* Compensation Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Compensation Information</CardTitle>
                  <CardDescription>Salary expectations and current compensation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Compensation Type</Label>
                    <Select
                      value={editedData.compensation?.salaryType || "salary"}
                      onValueChange={(value: 'salary' | 'hourly') =>
                        setEditedData({
                          ...editedData,
                          compensation: { ...editedData.compensation, salaryType: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">Annual Salary</SelectItem>
                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editedData.compensation?.salaryType === 'salary' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Current Salary</Label>
                        <Input
                          type="number"
                          value={editedData.compensation?.currentSalary || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              compensation: {
                                ...editedData.compensation,
                                currentSalary: e.target.value ? Number(e.target.value) : null,
                              },
                            })
                          }
                          placeholder="75000"
                        />
                      </div>
                      <div>
                        <Label>Expected Salary</Label>
                        <Input
                          type="number"
                          value={editedData.compensation?.expectedSalary || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              compensation: {
                                ...editedData.compensation,
                                expectedSalary: e.target.value ? Number(e.target.value) : null,
                              },
                            })
                          }
                          placeholder="90000"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Current Hourly Rate</Label>
                        <Input
                          type="number"
                          value={editedData.compensation?.currentHourlyRate || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              compensation: {
                                ...editedData.compensation,
                                currentHourlyRate: e.target.value ? Number(e.target.value) : null,
                              },
                            })
                          }
                          placeholder="50"
                        />
                      </div>
                      <div>
                        <Label>Expected Hourly Rate</Label>
                        <Input
                          type="number"
                          value={editedData.compensation?.expectedHourlyRate || ""}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              compensation: {
                                ...editedData.compensation,
                                expectedHourlyRate: e.target.value ? Number(e.target.value) : null,
                              },
                            })
                          }
                          placeholder="65"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Work Authorization */}
              <Card>
                <CardHeader>
                  <CardTitle>Work Authorization</CardTitle>
                  <CardDescription>Your work eligibility status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Work Authorization Status</Label>
                    <Select
                      value={editedData.workAuthorization?.status || ""}
                      onValueChange={(value) =>
                        setEditedData({
                          ...editedData,
                          workAuthorization: { ...editedData.workAuthorization, status: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="citizen">US Citizen</SelectItem>
                        <SelectItem value="green-card">Green Card Holder</SelectItem>
                        <SelectItem value="h1b">H1B Visa</SelectItem>
                        <SelectItem value="opt">OPT</SelectItem>
                        <SelectItem value="cpt">CPT</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="require-sponsorship">Require Sponsorship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Work Authorization End Date</Label>
                      <Input
                        type="date"
                        value={editedData.workAuthorization?.endDate || ""}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            workAuthorization: {
                              ...editedData.workAuthorization,
                              endDate: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>W2 Employer Name</Label>
                      <Input
                        value={editedData.workAuthorization?.w2EmployerName || ""}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            workAuthorization: {
                              ...editedData.workAuthorization,
                              w2EmployerName: e.target.value,
                            },
                          })
                        }
                        placeholder="Current employer name"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Language Proficiency */}
              <Card>
                <CardHeader>
                  <CardTitle>Language Proficiency</CardTitle>
                  <CardDescription>Select languages you can read, speak, and write</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Languages you can Read</Label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <Badge
                          key={lang}
                          variant={
                            editedData.languages?.read?.includes(lang) ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => toggleLanguage('read', lang)}
                        >
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-3 block">Languages you can Speak</Label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <Badge
                          key={lang}
                          variant={
                            editedData.languages?.speak?.includes(lang) ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => toggleLanguage('speak', lang)}
                        >
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-3 block">Languages you can Write</Label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <Badge
                          key={lang}
                          variant={
                            editedData.languages?.write?.includes(lang) ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => toggleLanguage('write', lang)}
                        >
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Step 6: Review & Submit */}
          {currentStep === 6 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Your Information</CardTitle>
                <CardDescription>
                  Please review all the information before submitting. You can go back to edit any section.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-2">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>Name:</strong> {editedData.personalInfo.name || "Not provided"}</p>
                      <p><strong>Email:</strong> {editedData.personalInfo.email || "Not provided"}</p>
                      <p><strong>Phone:</strong> {editedData.personalInfo.phone || "Not provided"}</p>
                      <p><strong>Location:</strong> {editedData.personalInfo.location || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {editedData.skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-2">Work Experience</h3>
                    <p className="text-sm">{editedData.experience.length} position(s) added</p>
                  </div>
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-2">Education</h3>
                    <p className="text-sm">{editedData.education.length} education record(s) added</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Additional Information</h3>
                    <p className="text-sm">
                      Work Authorization: {editedData.workAuthorization?.status || "Not specified"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {currentStep < WIZARD_STEPS.length ? (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saveProfileMutation.isPending}>
              {saveProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
