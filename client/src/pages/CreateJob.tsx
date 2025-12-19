import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  Sparkles,
  FileSpreadsheet,
  PenTool,
  Upload,
  Download,
  CheckCircle,
} from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import SkillMatrixBuilder, { SkillRequirement } from "@/components/SkillMatrixBuilder";

export default function CreateJob() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("manual");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual form state
  const [manualForm, setManualForm] = useState({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
    location: "",
    employmentType: "full-time",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    customerId: "",
    applicationDeadline: "",
  });

  // AI form state
  const [aiForm, setAiForm] = useState({
    primarySkill: "",
    secondarySkills: "",
    location: "",
    salaryRange: "",
    experienceLevel: "",
  });
  const [aiGeneratedDescription, setAiGeneratedDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Excel import state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Skill matrix state
  const [skillRequirements, setSkillRequirements] = useState<SkillRequirement[]>([]);

  // Fetch recruiter profile
  const { data: recruiter } = trpc.recruiter.getProfile.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  // Fetch customers for dropdown
  const { data: customers } = trpc.customer.list.useQuery(undefined, {
    enabled: !!recruiter?.id,
  });

  // Create job mutation
  const setSkillRequirementsMutation = trpc.skillMatrix.setJobSkillRequirements.useMutation();
  
  const createJobMutation = trpc.job.create.useMutation({
    onSuccess: async (data) => {
      // Save skill requirements if any
      if (skillRequirements.length > 0 && data?.id) {
        try {
          await setSkillRequirementsMutation.mutateAsync({
            jobId: data.id,
            skills: skillRequirements,
          });
        } catch (error) {
          console.error('Failed to save skill requirements:', error);
        }
      }
      toast.success("Job posted successfully!");
      setLocation("/recruiter/dashboard");
    },
    onError: (error: any) => {
      toast.error(`Failed to create job: ${error.message}`);
    },
  });

  // Generate AI description
  const handleGenerateAI = async () => {
    if (!aiForm.primarySkill) {
      toast.error("Please enter at least a primary skill");
      return;
    }

    setIsGenerating(true);
    try {
      // Call AI to generate job description
      const prompt = `Generate a professional job description for a ${aiForm.primarySkill} position with the following details:
- Primary Skill: ${aiForm.primarySkill}
- Secondary Skills: ${aiForm.secondarySkills || "Not specified"}
- Location: ${aiForm.location || "Remote"}
- Salary Range: ${aiForm.salaryRange || "Competitive"}
- Experience Level: ${aiForm.experienceLevel || "Mid-level"}

Please provide:
1. A compelling job title
2. A detailed job description (2-3 paragraphs)
3. Key responsibilities (5-7 bullet points)
4. Required qualifications (5-7 bullet points)

Format the output as JSON with keys: title, description, responsibilities, requirements`;

      // TODO: Replace with actual AI API call
      // For now, using a mock response
      const mockResponse = {
        title: `${aiForm.experienceLevel || "Mid-Level"} ${aiForm.primarySkill} Developer`,
        description: `We are seeking a talented ${aiForm.primarySkill} developer to join our dynamic team. In this role, you will be responsible for designing, developing, and maintaining high-quality software solutions that meet our clients' needs. You will work collaboratively with cross-functional teams to deliver innovative products and contribute to our company's growth.\n\nThe ideal candidate will have a strong foundation in ${aiForm.primarySkill} and ${aiForm.secondarySkills || "related technologies"}, with a passion for writing clean, efficient code. You will have the opportunity to work on challenging projects, learn new technologies, and grow your career in a supportive environment.`,
        responsibilities: `- Design and develop software applications using ${aiForm.primarySkill}\n- Collaborate with product managers and designers to define project requirements\n- Write clean, maintainable, and well-documented code\n- Participate in code reviews and provide constructive feedback\n- Troubleshoot and debug applications\n- Stay up-to-date with emerging technologies and industry trends\n- Mentor junior developers and contribute to team knowledge sharing`,
        requirements: `${aiForm.primarySkill}, ${aiForm.secondarySkills || "Problem-solving skills"}, Team collaboration, Version control (Git), Agile methodologies, ${aiForm.experienceLevel || "3+"} years of experience, Bachelor's degree in Computer Science or related field`,
      };

      setAiGeneratedDescription(JSON.stringify(mockResponse, null, 2));
      
      // Pre-fill manual form with AI-generated content
      setManualForm({
        ...manualForm,
        title: mockResponse.title,
        description: mockResponse.description,
        responsibilities: mockResponse.responsibilities,
        requirements: mockResponse.requirements,
        location: aiForm.location,
      });

      toast.success("Job description generated! Review and edit in the Manual tab.");
      setActiveTab("manual");
    } catch (error) {
      toast.error("Failed to generate job description");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle manual job creation
  const handleManualSubmit = async () => {
    // Validate required fields
    if (!manualForm.title || !manualForm.title.trim()) {
      toast.error("Job title is required");
      return;
    }

    if (!manualForm.description || !manualForm.description.trim()) {
      toast.error("Job description is required");
      return;
    }

    if (!manualForm.location || !manualForm.location.trim()) {
      toast.error("Location is required");
      return;
    }

    if (!recruiter?.companyName) {
      toast.error("Please complete your recruiter profile with company name");
      return;
    }

    if (!recruiter?.id) {
      toast.error("Recruiter profile not found");
      return;
    }

    // Validate salary range if provided
    if (manualForm.salaryMin && manualForm.salaryMax) {
      const min = parseInt(manualForm.salaryMin);
      const max = parseInt(manualForm.salaryMax);
      if (min > max) {
        toast.error("Minimum salary cannot be greater than maximum salary");
        return;
      }
    }

    // Validate deadline if provided
    if (manualForm.applicationDeadline) {
      const deadlineDate = new Date(manualForm.applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate < today) {
        toast.error("Application deadline must be in the future");
        return;
      }
    }

    await createJobMutation.mutateAsync({
      title: manualForm.title,
      description: manualForm.description,
      requirements: manualForm.requirements || undefined,
      responsibilities: manualForm.responsibilities || undefined,
      location: manualForm.location || undefined,
      employmentType: manualForm.employmentType as any,
      salaryMin: manualForm.salaryMin ? parseInt(manualForm.salaryMin) : undefined,
      salaryMax: manualForm.salaryMax ? parseInt(manualForm.salaryMax) : undefined,
      salaryCurrency: manualForm.salaryCurrency,
      customerId: manualForm.customerId ? parseInt(manualForm.customerId) : undefined,
      applicationDeadline: manualForm.applicationDeadline ? new Date(manualForm.applicationDeadline) : undefined,
      status: "active",
      isPublic: true,
    });
  };

  // Handle Excel file selection
  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (
        file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        setExcelFile(file);
      } else {
        toast.error("Please upload a valid Excel file (.xls or .xlsx)");
      }
    }
  };

  // Handle Excel import
  const handleExcelImport = async () => {
    if (!excelFile) {
      toast.error("Please select an Excel file");
      return;
    }

    setIsUploading(true);
    try {
      // TODO: Implement Excel parsing and bulk job creation
      // For now, showing a success message
      toast.success("Excel import feature coming soon!");
      setIsUploading(false);
    } catch (error) {
      toast.error("Failed to import jobs from Excel");
      setIsUploading(false);
    }
  };

  // Download Excel template
  const handleDownloadTemplate = () => {
    toast.info("Excel template download coming soon!");
  };

  if (!user) {
    setLocation("/");
    return null;
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
          <Button variant="outline" onClick={() => setLocation("/recruiter/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Post a New Job</CardTitle>
            <CardDescription>
              Choose how you want to create your job posting: manually, with AI assistance, or by
              importing from Excel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Generate
                </TabsTrigger>
                <TabsTrigger value="excel" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel Import
                </TabsTrigger>
              </TabsList>

              {/* Manual Entry Tab */}
              <TabsContent value="manual" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Senior React Developer"
                      value={manualForm.title}
                      onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the role, company, and what makes this opportunity great..."
                      value={manualForm.description}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, description: e.target.value })
                      }
                      rows={6}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="responsibilities">Key Responsibilities</Label>
                    <Textarea
                      id="responsibilities"
                      placeholder="List the main responsibilities (one per line or comma-separated)"
                      value={manualForm.responsibilities}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, responsibilities: e.target.value })
                      }
                      rows={4}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="requirements">Required Qualifications</Label>
                    <Textarea
                      id="requirements"
                      placeholder="List required skills and qualifications (one per line or comma-separated)"
                      value={manualForm.requirements}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, requirements: e.target.value })
                      }
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., New York, NY or Remote"
                      value={manualForm.location}
                      onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select
                      value={manualForm.employmentType}
                      onValueChange={(value) =>
                        setManualForm({ ...manualForm, employmentType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="temporary">Temporary</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="salaryMin">Minimum Salary</Label>
                    <Input
                      id="salaryMin"
                      type="number"
                      placeholder="50000"
                      value={manualForm.salaryMin}
                      onChange={(e) => setManualForm({ ...manualForm, salaryMin: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="salaryMax">Maximum Salary</Label>
                    <Input
                      id="salaryMax"
                      type="number"
                      placeholder="80000"
                      value={manualForm.salaryMax}
                      onChange={(e) => setManualForm({ ...manualForm, salaryMax: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="applicationDeadline">Application Deadline (Optional)</Label>
                    <Input
                      id="applicationDeadline"
                      type="date"
                      value={manualForm.applicationDeadline}
                      onChange={(e) => setManualForm({ ...manualForm, applicationDeadline: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Set a deadline to create urgency for candidates
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="customer">Client/Customer (Optional)</Label>
                    <Select
                      value={manualForm.customerId}
                      onValueChange={(value) =>
                        setManualForm({ ...manualForm, customerId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Skill Matrix Section */}
                <div className="mt-6">
                  <SkillMatrixBuilder
                    skills={skillRequirements}
                    onChange={setSkillRequirements}
                    maxSkills={10}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleManualSubmit}
                    disabled={createJobMutation.isPending}
                    className="flex-1"
                  >
                    {createJobMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Post Job
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/recruiter/dashboard")}
                  >
                    Cancel
                  </Button>
                </div>
              </TabsContent>

              {/* AI Generate Tab */}
              <TabsContent value="ai" className="space-y-4 mt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">
                        AI-Powered Job Description
                      </h3>
                      <p className="text-sm text-blue-700">
                        Provide key details and let AI generate a professional job description for
                        you. You can review and edit the generated content before posting.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primarySkill">Primary Skill *</Label>
                    <Input
                      id="primarySkill"
                      placeholder="e.g., React, Python, Java"
                      value={aiForm.primarySkill}
                      onChange={(e) => setAiForm({ ...aiForm, primarySkill: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="secondarySkills">Secondary Skills</Label>
                    <Input
                      id="secondarySkills"
                      placeholder="e.g., TypeScript, Node.js, AWS"
                      value={aiForm.secondarySkills}
                      onChange={(e) => setAiForm({ ...aiForm, secondarySkills: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="aiLocation">Location</Label>
                    <Input
                      id="aiLocation"
                      placeholder="e.g., San Francisco, CA or Remote"
                      value={aiForm.location}
                      onChange={(e) => setAiForm({ ...aiForm, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="salaryRange">Salary Range</Label>
                    <Input
                      id="salaryRange"
                      placeholder="e.g., $80,000 - $120,000"
                      value={aiForm.salaryRange}
                      onChange={(e) => setAiForm({ ...aiForm, salaryRange: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="experienceLevel">Experience Level</Label>
                    <Select
                      value={aiForm.experienceLevel}
                      onValueChange={(value) => setAiForm({ ...aiForm, experienceLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entry-Level">Entry-Level (0-2 years)</SelectItem>
                        <SelectItem value="Mid-Level">Mid-Level (3-5 years)</SelectItem>
                        <SelectItem value="Senior">Senior (5-10 years)</SelectItem>
                        <SelectItem value="Lead">Lead (10+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="w-full mt-4"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Job Description with AI
                    </>
                  )}
                </Button>

                {aiGeneratedDescription && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="font-semibold text-green-900">
                        Job description generated successfully!
                      </p>
                    </div>
                    <p className="text-sm text-green-700">
                      Switch to the "Manual Entry" tab to review and edit the generated content
                      before posting.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Excel Import Tab */}
              <TabsContent value="excel" className="space-y-4 mt-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-purple-900 mb-1">
                        Bulk Job Import from Excel
                      </h3>
                      <p className="text-sm text-purple-700 mb-2">
                        Upload an Excel file with multiple job listings to post them all at once.
                        Download our template to ensure proper formatting.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="mt-2"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Excel Template
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleExcelFileChange}
                    className="hidden"
                  />

                  {excelFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-3 text-green-600">
                        <FileSpreadsheet className="h-12 w-12" />
                        <div className="text-left">
                          <p className="font-semibold">{excelFile.name}</p>
                          <p className="text-sm text-gray-600">
                            {(excelFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={handleExcelImport} disabled={isUploading}>
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Import Jobs
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setExcelFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-semibold mb-1">Upload Excel File</p>
                        <p className="text-sm text-gray-600 mb-4">
                          Click below to select an Excel file (.xls or .xlsx)
                        </p>
                        <Button onClick={() => fileInputRef.current?.click()}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Select Excel File
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
