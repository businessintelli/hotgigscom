import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { Upload, FileText, Loader2, Check, X, ChevronLeft, Plus, Trash2, FileArchive, Table as TableIcon, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RecruiterLayout from '@/components/RecruiterLayout';
import { PhoneInput } from '@/components/ui/phone-input';
import { validatePhoneNumber } from '@shared/phoneValidation';
import JSZip from 'jszip';
import { CandidateWizard, WizardData } from '@/components/CandidateWizard';

interface EmploymentEntry {
  company: string;
  address: string;
  startDate: string;
  endDate: string;
}

interface CandidateFormData {
  // Basic Info
  name: string;
  email: string;
  phone: string;
  title: string;
  location: string;
  
  // Compensation
  currentSalary: string;
  expectedSalary: string;
  currentHourlyRate: string;
  expectedHourlyRate: string;
  salaryType: 'salary' | 'hourly';
  
  // Work Authorization
  workAuthorization: string;
  workAuthorizationEndDate: string;
  w2EmployerName: string;
  
  // Personal Info
  nationality: string;
  gender: string;
  dateOfBirth: string;
  
  // Education
  highestEducation: string;
  specialization: string;
  highestDegreeStartDate: string;
  highestDegreeEndDate: string;
  
  // Employment History
  employmentHistory: EmploymentEntry[];
  
  // Languages
  languagesRead: string[];
  languagesSpeak: string[];
  languagesWrite: string[];
  
  // Address
  currentResidenceZipCode: string;
  
  // Identification
  passportNumber: string;
  sinLast4: string;
  linkedinId: string;
  
  // Documents
  passportCopyUrl: string;
  dlCopyUrl: string;
  
  // Skills & Experience
  skills: string;
  experience: string;
  education: string;
  bio: string;
  
  // Resume
  resumeFile: File | null;
}

interface BulkResumeStatus {
  filename: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  candidateName?: string;
}

const INITIAL_FORM_DATA: CandidateFormData = {
  name: '', email: '', phone: '', title: '', location: '',
  currentSalary: '', expectedSalary: '', currentHourlyRate: '', expectedHourlyRate: '',
  salaryType: 'salary', workAuthorization: '', workAuthorizationEndDate: '', w2EmployerName: '',
  nationality: '', gender: '', dateOfBirth: '', highestEducation: '', specialization: '',
  highestDegreeStartDate: '', highestDegreeEndDate: '', employmentHistory: [],
  languagesRead: [], languagesSpeak: [], languagesWrite: [], currentResidenceZipCode: '',
  passportNumber: '', sinLast4: '', linkedinId: '', passportCopyUrl: '', dlCopyUrl: '',
  skills: '', experience: '', education: '', bio: '', resumeFile: null,
};

function AddCandidatePageContent() {
  const [, setLocation] = useLocation();
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk-resume' | 'bulk-excel'>('single');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Choose method, 2: Basic info, 3: Wizard
  const [entryMethod, setEntryMethod] = useState<'resume' | 'manual' | null>(null);
  const [formData, setFormData] = useState<CandidateFormData>(INITIAL_FORM_DATA);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [bulkResumeFiles, setBulkResumeFiles] = useState<File[]>([]);
  const [bulkResumeStatus, setBulkResumeStatus] = useState<BulkResumeStatus[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const { toast } = useToast();

  const addCandidateMutation = trpc.recruiter.addCandidateManually.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Candidate added successfully',
      });
      setLocation('/recruiter/search-candidates');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const parseResumeMutation = trpc.candidate.parseResumeFile.useMutation();
  const parseCSVMutation = trpc.candidate.parseImportFile.useMutation();
  const bulkImportMutation = trpc.candidate.bulkImport.useMutation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Resume must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setIsParsing(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Store the file and parse with tRPC mutation
      setFormData(prev => ({ ...prev, resumeFile: file }));
      
      // Parse resume with AI using tRPC
      const parsed = await parseResumeMutation.mutateAsync({
        fileData: base64,
        filename: file.name,
        mimeType: file.type,
      });

      // Auto-fill form data from parsed resume
      setFormData(prev => ({
        ...prev,
        name: parsed.personalInfo?.name || '',
        email: parsed.personalInfo?.email || '',
        phone: parsed.personalInfo?.phone || '',
        location: parsed.personalInfo?.location || '',
        title: parsed.experience?.[0]?.title || '',
        skills: parsed.skills?.join(', ') || '',
        experience: parsed.experience?.map((exp: any) => 
          `${exp.title} at ${exp.company} (${exp.duration || ''})`
        ).join('\n') || '',
        education: parsed.education?.map((edu: any) => 
          `${edu.degree} in ${edu.fieldOfStudy || ''} from ${edu.institution}`
        ).join('\n') || '',
        bio: parsed.summary || '',
        nationality: parsed.personalInfo?.nationality || '',
        gender: parsed.personalInfo?.gender || '',
        dateOfBirth: parsed.personalInfo?.dateOfBirth || '',
        passportNumber: parsed.personalInfo?.passportNumber || '',
        linkedinId: parsed.personalInfo?.linkedinId || '',
        highestEducation: parsed.education?.[0]?.degree || '',
        specialization: parsed.education?.[0]?.fieldOfStudy || '',
        highestDegreeStartDate: parsed.education?.[0]?.startDate || '',
        highestDegreeEndDate: parsed.education?.[0]?.endDate || '',
        employmentHistory: parsed.experience?.map((exp: any) => ({
          company: exp.company || '',
          address: exp.address || exp.location || '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || '',
        })) || [],
        languagesRead: parsed.languages?.read || [],
        languagesSpeak: parsed.languages?.speak || [],
        languagesWrite: parsed.languages?.write || [],
        currentResidenceZipCode: parsed.address?.zipCode || '',
        workAuthorization: parsed.workAuthorization?.status || '',
        workAuthorizationEndDate: parsed.workAuthorization?.endDate || '',
        w2EmployerName: parsed.workAuthorization?.w2EmployerName || '',
        currentSalary: parsed.compensation?.currentSalary?.toString() || '',
        expectedSalary: parsed.compensation?.expectedSalary?.toString() || '',
        currentHourlyRate: parsed.compensation?.currentHourlyRate?.toString() || '',
        expectedHourlyRate: parsed.compensation?.expectedHourlyRate?.toString() || '',
        salaryType: parsed.compensation?.salaryType || 'salary',
      }));
      
      setIsParsing(false);
      setIsUploading(false);
      toast({
        title: 'Resume Parsed Successfully',
        description: 'Resume data extracted. Please review and complete any missing fields.',
      });

      // Auto-advance to wizard for additional information
      setStep(3);
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      setIsParsing(false);
      setIsUploading(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to parse resume. Please try again or enter manually.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if it's a ZIP file
    if (files.length === 1 && files[0].name.endsWith('.zip')) {
      try {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(files[0]);
        const resumeFiles: File[] = [];

        for (const [filename, file] of Object.entries(zipContent.files)) {
          if (!file.dir && (filename.endsWith('.pdf') || filename.endsWith('.doc') || filename.endsWith('.docx'))) {
            const blob = await file.async('blob');
            const resumeFile = new File([blob], filename, { type: blob.type });
            resumeFiles.push(resumeFile);
          }
        }

        if (resumeFiles.length === 0) {
          toast({
            title: 'No resumes found',
            description: 'ZIP file must contain PDF or DOC/DOCX files',
            variant: 'destructive',
          });
          return;
        }

        setBulkResumeFiles(resumeFiles);
        setBulkResumeStatus(resumeFiles.map(f => ({
          filename: f.name,
          status: 'pending',
        })));

        toast({
          title: 'ZIP extracted',
          description: `Found ${resumeFiles.length} resume(s). Click "Process All Resumes" to import.`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to extract ZIP file',
          variant: 'destructive',
        });
      }
    } else {
      // Multiple individual files
      const resumeFiles = files.filter(f => 
        f.name.endsWith('.pdf') || f.name.endsWith('.doc') || f.name.endsWith('.docx')
      );

      if (resumeFiles.length === 0) {
        toast({
          title: 'Invalid files',
          description: 'Please upload PDF or DOC/DOCX files',
          variant: 'destructive',
        });
        return;
      }

      setBulkResumeFiles(resumeFiles);
      setBulkResumeStatus(resumeFiles.map(f => ({
        filename: f.name,
        status: 'pending',
      })));

      toast({
        title: 'Files selected',
        description: `${resumeFiles.length} resume(s) ready. Click "Process All Resumes" to import.`,
      });
    }
  };

  const processBulkResumes = async () => {
    setIsBulkProcessing(true);
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < bulkResumeFiles.length; i++) {
      const file = bulkResumeFiles[i];
      
      // Update status to processing
      setBulkResumeStatus(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: 'processing' } : s
      ));

      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Parse resume
        const parsed = await parseResumeMutation.mutateAsync({
          fileData: base64,
          filename: file.name,
          mimeType: file.type,
        });

        // Create candidate
        await addCandidateMutation.mutateAsync({
          name: parsed.personalInfo?.name || file.name.replace(/\.[^/.]+$/, ''),
          email: parsed.personalInfo?.email || '',
          phone: parsed.personalInfo?.phone,
          title: parsed.experience?.[0]?.title,
          location: parsed.personalInfo?.location,
          skills: parsed.skills?.join(', '),
          experience: parsed.experience?.map((exp: any) => 
            `${exp.title} at ${exp.company} (${exp.duration || ''})`
          ).join('\n'),
          education: parsed.education?.map((edu: any) => 
            `${edu.degree} in ${edu.fieldOfStudy || ''} from ${edu.institution}`
          ).join('\n'),
          bio: parsed.summary,
          nationality: parsed.personalInfo?.nationality,
          gender: parsed.personalInfo?.gender,
          dateOfBirth: parsed.personalInfo?.dateOfBirth,
          workAuthorization: parsed.workAuthorization?.status,
          workAuthorizationEndDate: parsed.workAuthorization?.endDate,
          w2EmployerName: parsed.workAuthorization?.w2EmployerName,
          currentSalary: parsed.compensation?.currentSalary?.toString(),
          expectedSalary: parsed.compensation?.expectedSalary?.toString(),
          currentHourlyRate: parsed.compensation?.currentHourlyRate?.toString(),
          expectedHourlyRate: parsed.compensation?.expectedHourlyRate?.toString(),
          salaryType: parsed.compensation?.salaryType || 'salary',
          highestEducation: parsed.education?.[0]?.degree,
          specialization: parsed.education?.[0]?.fieldOfStudy,
          highestDegreeStartDate: parsed.education?.[0]?.startDate,
          highestDegreeEndDate: parsed.education?.[0]?.endDate,
          employmentHistory: parsed.experience?.map((exp: any) => ({
            company: exp.company || '',
            address: exp.address || exp.location || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
          })),
          languagesRead: parsed.languages?.read,
          languagesSpeak: parsed.languages?.speak,
          languagesWrite: parsed.languages?.write,
          currentResidenceZipCode: parsed.address?.zipCode,
          passportNumber: parsed.personalInfo?.passportNumber,
          linkedinId: parsed.personalInfo?.linkedinId,
        });

        setBulkResumeStatus(prev => prev.map((s, idx) => 
          idx === i ? { 
            ...s, 
            status: 'success',
            candidateName: parsed.personalInfo?.name || file.name
          } : s
        ));
        successCount++;
      } catch (error: any) {
        setBulkResumeStatus(prev => prev.map((s, idx) => 
          idx === i ? { 
            ...s, 
            status: 'error',
            error: error.message || 'Failed to process resume'
          } : s
        ));
        failedCount++;
      }
    }

    setIsBulkProcessing(false);
    toast({
      title: 'Bulk import complete',
      description: `Successfully imported ${successCount} candidates. ${failedCount} failed.`,
    });
  };

  const downloadExcelTemplate = () => {
    const headers = [
      "name",
      "email",
      "phone",
      "location",
      "skills",
      "workAuthorization",
      "nationality",
      "gender",
      "dateOfBirth",
      "currentSalary",
      "expectedSalary",
      "salaryType",
      "highestEducation",
      "specialization",
      "currentResidenceZipCode",
      "linkedinId"
    ];

    const sampleData = [
      [
        "John Doe",
        "john.doe@example.com",
        "+1-555-0123",
        "New York, NY",
        "JavaScript, React, Node.js",
        "US Citizen",
        "American",
        "Male",
        "1990-01-15",
        "85000",
        "95000",
        "salary",
        "Bachelor's Degree",
        "Computer Science",
        "10001",
        "linkedin.com/in/johndoe"
      ]
    ];

    const csvContent = [
      headers.join(","),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "candidate_import_template.csv";
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Template downloaded",
      description: "Fill in the template with candidate information and upload it back.",
    });
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      
      try {
        const result = await parseCSVMutation.mutateAsync({
          content,
          filename: file.name,
        });

        if (result.success && result.data) {
          // Import candidates
          const importResult = await bulkImportMutation.mutateAsync({
            candidates: result.data.filter((row: any) => row.validation?.isValid !== false),
          });

          toast({
            title: "Import complete",
            description: `Successfully imported ${importResult.successCount} candidates. ${importResult.failedCount} failed.`,
          });

          if (importResult.successCount > 0) {
            setLocation('/recruiter/search-candidates');
          }
        } else {
          toast({
            title: "Parse error",
            description: result.error || "Failed to parse file",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Import failed",
          description: error.message || "Failed to import candidates",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
  };

  const handleBasicInfoNext = () => {
    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Candidate name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.phone || !formData.phone.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Phone number is required',
        variant: 'destructive',
      });
      return;
    }

    // Validate phone number format
    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      toast({
        title: 'Validation Error',
        description: phoneValidation.error || 'Invalid phone number format',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.location || !formData.location.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Location is required',
        variant: 'destructive',
      });
      return;
    }

    // Move to wizard step
    setStep(3);
  };

  const handleWizardComplete = (wizardData: WizardData) => {
    // Submit to backend with merged data
    addCandidateMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      title: formData.title || undefined,
      location: formData.location || undefined,
      skills: formData.skills || undefined,
      experience: formData.experience || undefined,
      education: formData.education || undefined,
      bio: formData.bio || undefined,
      nationality: wizardData.nationality || formData.nationality || undefined,
      gender: wizardData.gender || formData.gender || undefined,
      dateOfBirth: wizardData.dateOfBirth ? wizardData.dateOfBirth.toISOString().split('T')[0] : formData.dateOfBirth || undefined,
      workAuthorization: wizardData.workAuthorization || formData.workAuthorization || undefined,
      workAuthorizationEndDate: wizardData.workAuthorizationEndDate ? wizardData.workAuthorizationEndDate.toISOString().split('T')[0] : formData.workAuthorizationEndDate || undefined,
      w2EmployerName: wizardData.w2EmployerName || formData.w2EmployerName || undefined,
      currentSalary: wizardData.currentSalary || (formData.currentSalary ? parseFloat(formData.currentSalary) : undefined),
      expectedSalary: wizardData.expectedSalary || (formData.expectedSalary ? parseFloat(formData.expectedSalary) : undefined),
      currentHourlyRate: wizardData.currentHourlyRate || (formData.currentHourlyRate ? parseFloat(formData.currentHourlyRate) : undefined),
      expectedHourlyRate: wizardData.expectedHourlyRate || (formData.expectedHourlyRate ? parseFloat(formData.expectedHourlyRate) : undefined),
      salaryType: wizardData.salaryType || formData.salaryType,
      highestEducation: wizardData.highestEducation || formData.highestEducation || undefined,
      specialization: wizardData.specialization || formData.specialization || undefined,
      highestDegreeStartDate: wizardData.highestDegreeStartDate ? wizardData.highestDegreeStartDate.toISOString().split('T')[0] : formData.highestDegreeStartDate || undefined,
      highestDegreeEndDate: wizardData.highestDegreeEndDate ? wizardData.highestDegreeEndDate.toISOString().split('T')[0] : formData.highestDegreeEndDate || undefined,
      employmentHistory: (wizardData.employmentHistory && wizardData.employmentHistory.length > 0) ? wizardData.employmentHistory : (formData.employmentHistory.length > 0 ? formData.employmentHistory : undefined),
      languagesRead: (wizardData.languagesRead && wizardData.languagesRead.length > 0) ? wizardData.languagesRead : (formData.languagesRead.length > 0 ? formData.languagesRead : undefined),
      languagesSpeak: (wizardData.languagesSpeak && wizardData.languagesSpeak.length > 0) ? wizardData.languagesSpeak : (formData.languagesSpeak.length > 0 ? formData.languagesSpeak : undefined),
      languagesWrite: (wizardData.languagesWrite && wizardData.languagesWrite.length > 0) ? wizardData.languagesWrite : (formData.languagesWrite.length > 0 ? formData.languagesWrite : undefined),
      currentResidenceZipCode: wizardData.currentResidenceZipCode || formData.currentResidenceZipCode || undefined,
      passportNumber: wizardData.passportNumber || formData.passportNumber || undefined,
      sinLast4: wizardData.sinLast4 || formData.sinLast4 || undefined,
      linkedinId: wizardData.linkedinId || formData.linkedinId || undefined,
      passportCopyUrl: wizardData.passportCopyUrl || formData.passportCopyUrl || undefined,
      dlCopyUrl: wizardData.dlCopyUrl || formData.dlCopyUrl || undefined,
    });
  };

  // Step 1: Choose upload method
  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/recruiter/search-candidates')}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Add Candidates</h1>
          <p className="text-gray-600 mt-2">
            Choose how you want to add candidates to your database
          </p>
        </div>

        <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single">Single Resume</TabsTrigger>
            <TabsTrigger value="bulk-resume">Bulk Resumes</TabsTrigger>
            <TabsTrigger value="bulk-excel">Excel/CSV Import</TabsTrigger>
          </TabsList>

          {/* Single Resume Upload */}
          <TabsContent value="single" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Single Resume</CardTitle>
                <CardDescription>
                  Upload a resume to automatically extract candidate information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Upload Resume (PDF/DOC/DOCX)</h3>
                  <p className="text-gray-600 mb-4">
                    AI will automatically extract candidate information
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="single-resume-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="single-resume-upload">
                    <Button asChild disabled={isUploading}>
                      <span>
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Select Resume
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEntryMethod('manual');
                    setStep(2);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Enter Candidate Information Manually
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Resume Upload */}
          <TabsContent value="bulk-resume" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Resume Upload</CardTitle>
                <CardDescription>
                  Upload multiple resumes at once or a ZIP file containing resumes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <FileArchive className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Upload Multiple Resumes or ZIP</h3>
                  <p className="text-gray-600 mb-4">
                    Select multiple PDF/DOC/DOCX files or a ZIP file containing resumes
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.zip"
                    multiple
                    onChange={handleBulkResumeUpload}
                    className="hidden"
                    id="bulk-resume-upload"
                    disabled={isBulkProcessing}
                  />
                  <label htmlFor="bulk-resume-upload">
                    <Button asChild disabled={isBulkProcessing}>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Select Files
                      </span>
                    </Button>
                  </label>
                </div>

                {bulkResumeFiles.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{bulkResumeFiles.length} Resume(s) Selected</h4>
                      <Button
                        onClick={processBulkResumes}
                        disabled={isBulkProcessing}
                      >
                        {isBulkProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Process All Resumes'
                        )}
                      </Button>
                    </div>

                    <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                      {bulkResumeStatus.map((status, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{status.filename}</p>
                              {status.candidateName && (
                                <p className="text-sm text-gray-600">{status.candidateName}</p>
                              )}
                              {status.error && (
                                <p className="text-sm text-red-600">{status.error}</p>
                              )}
                            </div>
                          </div>
                          <div>
                            {status.status === 'pending' && (
                              <span className="text-gray-400">Pending</span>
                            )}
                            {status.status === 'processing' && (
                              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            )}
                            {status.status === 'success' && (
                              <Check className="w-5 h-5 text-green-500" />
                            )}
                            {status.status === 'error' && (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Excel/CSV Import */}
          <TabsContent value="bulk-excel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Excel/CSV Import</CardTitle>
                <CardDescription>
                  Import candidate data from Excel or CSV file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={downloadExcelTemplate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                  <span className="text-sm text-gray-500">
                    Download the template to see the required format
                  </span>
                </div>

                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <TableIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Upload CSV or Excel File</h3>
                  <p className="text-gray-600 mb-4">
                    Upload a file with candidate information in the template format
                  </p>
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleExcelUpload}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label htmlFor="excel-upload">
                    <Button asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Select File
                      </span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Step 3: Wizard for additional information
  if (step === 3) {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
          <CandidateWizard
            initialData={{
              salaryType: formData.salaryType,
              currentSalary: formData.currentSalary ? parseInt(formData.currentSalary) : undefined,
              currentHourlyRate: formData.currentHourlyRate ? parseInt(formData.currentHourlyRate) : undefined,
              expectedSalary: formData.expectedSalary ? parseInt(formData.expectedSalary) : undefined,
              expectedHourlyRate: formData.expectedHourlyRate ? parseInt(formData.expectedHourlyRate) : undefined,
              workAuthorization: formData.workAuthorization,
              workAuthorizationEndDate: formData.workAuthorizationEndDate ? new Date(formData.workAuthorizationEndDate) : undefined,
              w2EmployerName: formData.w2EmployerName,
              nationality: formData.nationality,
              gender: formData.gender,
              dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
              currentResidenceZipCode: formData.currentResidenceZipCode,
              linkedinId: formData.linkedinId,
              highestEducation: formData.highestEducation,
              specialization: formData.specialization,
              highestDegreeStartDate: formData.highestDegreeStartDate ? new Date(formData.highestDegreeStartDate) : undefined,
              highestDegreeEndDate: formData.highestDegreeEndDate ? new Date(formData.highestDegreeEndDate) : undefined,
              employmentHistory: formData.employmentHistory,
              languagesRead: formData.languagesRead,
              languagesSpeak: formData.languagesSpeak,
              languagesWrite: formData.languagesWrite,
              passportNumber: formData.passportNumber,
              sinLast4: formData.sinLast4,
              passportCopyUrl: formData.passportCopyUrl,
              dlCopyUrl: formData.dlCopyUrl,
            }}
            onComplete={handleWizardComplete}
            onCancel={() => setStep(2)}
            title="Complete Candidate Profile"
            description={`Submitting candidate: ${formData.name}`}
          />
        </div>
    );
  }

  // Step 2: Form (only for single candidate entry)
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStep(1);
            setFormData(INITIAL_FORM_DATA);
            setEntryMethod(null);
          }}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Candidate Information</h1>
        <p className="text-gray-600 mt-2">
          {entryMethod === 'resume' 
            ? 'Review and complete the extracted information' 
            : 'Enter candidate details manually'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <PhoneInput
                value={formData.phone}
                onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="New York, NY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Software Engineer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Textarea
              id="skills"
              value={formData.skills}
              onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
              placeholder="JavaScript, React, Node.js, Python..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio/Summary</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Brief professional summary..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => {
            setStep(1);
            setFormData(INITIAL_FORM_DATA);
            setEntryMethod(null);
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleBasicInfoNext}
        >
          Next: Additional Information
        </Button>
      </div>
    </div>
  );
}

export default function AddCandidatePage() {
  return (
    <RecruiterLayout>
      <AddCandidatePageContent />
    </RecruiterLayout>
  );
}
