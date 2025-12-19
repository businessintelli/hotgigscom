import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Upload, FileText, Loader2, Check, X, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RecruiterLayout from '@/components/RecruiterLayout';
import { PhoneInput } from '@/components/ui/phone-input';
import { validatePhoneNumber } from '@shared/phoneValidation';

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
  const [step, setStep] = useState<1 | 2>(1);
  const [entryMethod, setEntryMethod] = useState<'resume' | 'manual' | null>(null);
  const [formData, setFormData] = useState<CandidateFormData>(INITIAL_FORM_DATA);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
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

  const parseResumeMutation = trpc.candidate.parseResumeFile.useMutation({
    onSuccess: (parsed) => {
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

      // Auto-advance to form
      setStep(2);
    },
    onError: (error) => {
      setIsParsing(false);
      setIsUploading(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to parse resume. Please try again or enter manually.',
        variant: 'destructive',
      });
    },
  });

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
      parseResumeMutation.mutate({
        fileData: base64,
        filename: file.name,
        mimeType: file.type,
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      setIsParsing(false);
      setIsUploading(false);
      toast({
        title: 'Error',
        description: 'Failed to upload resume',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = () => {
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
      currentSalary: formData.currentSalary ? parseInt(formData.currentSalary) : undefined,
      expectedSalary: formData.expectedSalary ? parseInt(formData.expectedSalary) : undefined,
      currentHourlyRate: formData.currentHourlyRate ? parseFloat(formData.currentHourlyRate) : undefined,
      expectedHourlyRate: formData.expectedHourlyRate ? parseFloat(formData.expectedHourlyRate) : undefined,
      salaryType: formData.salaryType,
      workAuthorization: formData.workAuthorization || undefined,
      workAuthorizationEndDate: formData.workAuthorizationEndDate || undefined,
      w2EmployerName: formData.w2EmployerName || undefined,
      nationality: formData.nationality || undefined,
      gender: formData.gender || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      highestEducation: formData.highestEducation || undefined,
      specialization: formData.specialization || undefined,
      highestDegreeStartDate: formData.highestDegreeStartDate || undefined,
      highestDegreeEndDate: formData.highestDegreeEndDate || undefined,
      employmentHistory: formData.employmentHistory.length > 0 ? JSON.stringify(formData.employmentHistory) : undefined,
      languagesRead: formData.languagesRead.length > 0 ? JSON.stringify(formData.languagesRead) : undefined,
      languagesSpeak: formData.languagesSpeak.length > 0 ? JSON.stringify(formData.languagesSpeak) : undefined,
      languagesWrite: formData.languagesWrite.length > 0 ? JSON.stringify(formData.languagesWrite) : undefined,
      currentResidenceZipCode: formData.currentResidenceZipCode || undefined,
      passportNumber: formData.passportNumber || undefined,
      sinLast4: formData.sinLast4 || undefined,
      linkedinId: formData.linkedinId || undefined,
      passportCopyUrl: formData.passportCopyUrl || undefined,
      dlCopyUrl: formData.dlCopyUrl || undefined,
    });
  };

  const addEmploymentEntry = () => {
    setFormData(prev => ({
      ...prev,
      employmentHistory: [...prev.employmentHistory, { company: '', address: '', startDate: '', endDate: '' }],
    }));
  };

  const removeEmploymentEntry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      employmentHistory: prev.employmentHistory.filter((_, i) => i !== index),
    }));
  };

  const updateEmploymentEntry = (index: number, field: keyof EmploymentEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      employmentHistory: prev.employmentHistory.map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  if (step === 1) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation('/recruiter/search-candidates')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Candidate Search
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Candidate</CardTitle>
            <CardDescription>Choose how you'd like to add the candidate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all hover:border-primary ${entryMethod === 'resume' ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setEntryMethod('resume')}
              >
                <CardContent className="pt-6 text-center">
                  <Upload className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Upload Resume</h3>
                  <p className="text-sm text-muted-foreground">
                    AI will extract candidate information automatically
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:border-primary ${entryMethod === 'manual' ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setEntryMethod('manual')}
              >
                <CardContent className="pt-6 text-center">
                  <FileText className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Manual Entry</h3>
                  <p className="text-sm text-muted-foreground">
                    Fill in candidate details manually
                  </p>
                </CardContent>
              </Card>
            </div>

            {entryMethod === 'resume' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    {isUploading || isParsing ? (
                      <div className="space-y-2">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                          {isParsing ? 'Parsing resume with AI...' : 'Uploading...'}
                        </p>
                      </div>
                    ) : formData.resumeFile ? (
                      <div className="space-y-2">
                        <Check className="mx-auto h-12 w-12 text-green-500" />
                        <p className="font-medium">{formData.resumeFile.name}</p>
                        <p className="text-sm text-muted-foreground">Click to change file</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="font-medium">Click to upload resume</p>
                        <p className="text-sm text-muted-foreground">PDF, DOC, or DOCX (max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            {entryMethod === 'manual' && (
              <Button onClick={() => setStep(2)} className="w-full">
                Continue to Form
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Form
  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setStep(1)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Information</CardTitle>
          <CardDescription>Fill in the candidate details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 234 567 8900"
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
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="New York, NY"
                />
              </div>
            </div>
          </div>

          {/* Skills & Experience */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Skills & Experience</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <Textarea
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="React, Node.js, TypeScript, etc."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Work Experience</Label>
                <Textarea
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="Describe work history..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Textarea
                  id="education"
                  value={formData.education}
                  onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                  placeholder="Degree, institution, etc."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Summary</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Professional summary..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Compensation</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Salary Type</Label>
                <Select value={formData.salaryType} onValueChange={(value: 'salary' | 'hourly') => setFormData(prev => ({ ...prev, salaryType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Annual Salary</SelectItem>
                    <SelectItem value="hourly">Hourly Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.salaryType === 'salary' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentSalary">Current Salary</Label>
                    <Input
                      id="currentSalary"
                      type="number"
                      value={formData.currentSalary}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentSalary: e.target.value }))}
                      placeholder="80000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedSalary">Expected Salary</Label>
                    <Input
                      id="expectedSalary"
                      type="number"
                      value={formData.expectedSalary}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedSalary: e.target.value }))}
                      placeholder="100000"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentHourlyRate">Current Hourly Rate</Label>
                    <Input
                      id="currentHourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.currentHourlyRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentHourlyRate: e.target.value }))}
                      placeholder="40.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedHourlyRate">Expected Hourly Rate</Label>
                    <Input
                      id="expectedHourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.expectedHourlyRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedHourlyRate: e.target.value }))}
                      placeholder="50.00"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={addCandidateMutation.isPending}>
              {addCandidateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Candidate
            </Button>
          </div>
        </CardContent>
      </Card>
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
