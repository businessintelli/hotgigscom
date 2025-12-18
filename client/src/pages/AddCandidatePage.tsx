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

export default function AddCandidatePage() {
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

      // Parse resume with AI
      const response = await fetch('/api/trpc/candidates.parseResumeFile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64,
          filename: file.name,
          mimeType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse resume');
      }

      const { result } = await response.json();
      const parsed = result.data;

      // Auto-fill form data from parsed resume
      setFormData(prev => ({
        ...prev,
        resumeFile: file,
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

      toast({
        title: 'Resume Parsed Successfully',
        description: 'Resume data extracted. Please review and complete any missing fields.',
      });

      // Auto-advance to form
      setStep(2);
    } catch (error) {
      console.error('Error parsing resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to parse resume. Please try again or enter manually.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: 'Required Fields Missing',
        description: 'Please fill in name, email, and phone number',
        variant: 'destructive',
      });
      return;
    }

    await addCandidateMutation.mutateAsync({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      title: formData.title || undefined,
      location: formData.location || undefined,
      skills: formData.skills || undefined,
      experience: formData.experience || undefined,
      education: formData.education || undefined,
      bio: formData.bio || undefined,
      currentSalary: formData.currentSalary ? parseInt(formData.currentSalary) : undefined,
      expectedSalary: formData.expectedSalary ? parseInt(formData.expectedSalary) : undefined,
      currentHourlyRate: formData.currentHourlyRate ? parseInt(formData.currentHourlyRate) : undefined,
      expectedHourlyRate: formData.expectedHourlyRate ? parseInt(formData.expectedHourlyRate) : undefined,
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
      resumeFile: formData.resumeFile,
    });
  };

  const addEmployment = () => {
    setFormData(prev => ({
      ...prev,
      employmentHistory: [...prev.employmentHistory, { company: '', address: '', startDate: '', endDate: '' }]
    }));
  };

  const removeEmployment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      employmentHistory: prev.employmentHistory.filter((_, i) => i !== index)
    }));
  };

  const updateEmployment = (index: number, field: keyof EmploymentEntry, value: string) => {
    setFormData(prev => {
      const updated = [...prev.employmentHistory];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, employmentHistory: updated };
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => step === 1 ? setLocation('/recruiter/search-candidates') : setStep(1)}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            {step === 1 ? 'Back to Candidates' : 'Back to Entry Method'}
          </Button>
          <h1 className="text-3xl font-bold mt-4">Add New Candidate</h1>
          <p className="text-muted-foreground mt-2">
            {step === 1 ? 'Choose how to add candidate information' : 'Complete candidate profile information'}
          </p>
        </div>

        {/* Step 1: Entry Method Selection */}
        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="cursor-pointer hover:border-primary transition-all" onClick={() => {
              setEntryMethod('resume');
            }}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Upload Resume</CardTitle>
                <CardDescription>
                  AI will automatically extract and fill all candidate information from the resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                {entryMethod === 'resume' && (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="resume-upload"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      {isUploading || isParsing ? (
                        <div className="space-y-3">
                          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                          <p className="font-medium">{isParsing ? 'Parsing resume with AI...' : 'Uploading...'}</p>
                        </div>
                      ) : formData.resumeFile ? (
                        <div className="space-y-3">
                          <Check className="w-12 h-12 mx-auto text-green-500" />
                          <p className="font-medium">{formData.resumeFile.name}</p>
                          <p className="text-sm text-muted-foreground">Click to change file</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                          <p className="font-medium">Click to upload resume</p>
                          <p className="text-sm text-muted-foreground">PDF or DOCX, max 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-all" onClick={() => {
              setEntryMethod('manual');
              setStep(2);
            }}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Manual Entry</CardTitle>
                <CardDescription>
                  Enter candidate information manually using the comprehensive form
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => {
                  setEntryMethod('manual');
                  setStep(2);
                }}>
                  Start Manual Entry
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Comprehensive Form */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Essential candidate details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Senior Software Engineer"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compensation */}
            <Card>
              <CardHeader>
                <CardTitle>Compensation Details</CardTitle>
                <CardDescription>Salary and hourly rate information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="salaryType">Compensation Type</Label>
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentSalary">Current Salary (USD)</Label>
                      <Input
                        id="currentSalary"
                        type="number"
                        value={formData.currentSalary}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentSalary: e.target.value }))}
                        placeholder="80000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expectedSalary">Expected Salary (USD)</Label>
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentHourlyRate">Current Hourly Rate (USD)</Label>
                      <Input
                        id="currentHourlyRate"
                        type="number"
                        value={formData.currentHourlyRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentHourlyRate: e.target.value }))}
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expectedHourlyRate">Expected Hourly Rate (USD)</Label>
                      <Input
                        id="expectedHourlyRate"
                        type="number"
                        value={formData.expectedHourlyRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, expectedHourlyRate: e.target.value }))}
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
                <CardDescription>Visa and work permit information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workAuthorization">Work Authorization Status</Label>
                  <Select value={formData.workAuthorization} onValueChange={(value) => setFormData(prev => ({ ...prev, workAuthorization: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizen">US Citizen</SelectItem>
                      <SelectItem value="green-card">Green Card</SelectItem>
                      <SelectItem value="h1b">H1B Visa</SelectItem>
                      <SelectItem value="opt">OPT</SelectItem>
                      <SelectItem value="cpt">CPT</SelectItem>
                      <SelectItem value="tn">TN Visa</SelectItem>
                      <SelectItem value="l1">L1 Visa</SelectItem>
                      <SelectItem value="requires-sponsorship">Requires Sponsorship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workAuthorizationEndDate">Authorization End Date</Label>
                    <Input
                      id="workAuthorizationEndDate"
                      type="date"
                      value={formData.workAuthorizationEndDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, workAuthorizationEndDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="w2EmployerName">W2 Employer Name</Label>
                    <Input
                      id="w2EmployerName"
                      value={formData.w2EmployerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, w2EmployerName: e.target.value }))}
                      placeholder="Current employer"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Demographic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                      placeholder="United States"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
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
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
                <CardDescription>Highest degree and specialization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="highestEducation">Highest Education Level</Label>
                    <Select value={formData.highestEducation} onValueChange={(value) => setFormData(prev => ({ ...prev, highestEducation: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High School">High School</SelectItem>
                        <SelectItem value="Associate">Associate Degree</SelectItem>
                        <SelectItem value="Bachelor">Bachelor's Degree</SelectItem>
                        <SelectItem value="Master">Master's Degree</SelectItem>
                        <SelectItem value="PhD">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="specialization">Specialization/Major</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                      placeholder="Computer Science"
                    />
                  </div>
                  <div>
                    <Label htmlFor="highestDegreeStartDate">Start Date</Label>
                    <Input
                      id="highestDegreeStartDate"
                      type="date"
                      value={formData.highestDegreeStartDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, highestDegreeStartDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="highestDegreeEndDate">End Date</Label>
                    <Input
                      id="highestDegreeEndDate"
                      type="date"
                      value={formData.highestDegreeEndDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, highestDegreeEndDate: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment History */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Employment History</CardTitle>
                    <CardDescription>Previous work experience</CardDescription>
                  </div>
                  <Button onClick={addEmployment} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Employment
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.employmentHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No employment history added yet</p>
                    <Button variant="outline" className="mt-4" onClick={addEmployment}>
                      Add First Employment
                    </Button>
                  </div>
                ) : (
                  formData.employmentHistory.map((emp, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Employment {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmployment(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label>Company</Label>
                          <Input
                            value={emp.company}
                            onChange={(e) => updateEmployment(index, 'company', e.target.value)}
                            placeholder="Company name"
                          />
                        </div>
                        <div>
                          <Label>Address</Label>
                          <Input
                            value={emp.address}
                            onChange={(e) => updateEmployment(index, 'address', e.target.value)}
                            placeholder="City, State"
                          />
                        </div>
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={emp.startDate}
                            onChange={(e) => updateEmployment(index, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={emp.endDate}
                            onChange={(e) => updateEmployment(index, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Languages */}
            <Card>
              <CardHeader>
                <CardTitle>Language Proficiency</CardTitle>
                <CardDescription>Languages and proficiency levels</CardDescription>
              </CardHeader>
              <CardContent>
                <LanguageProficiencySelector
                  languagesRead={formData.languagesRead}
                  languagesSpeak={formData.languagesSpeak}
                  languagesWrite={formData.languagesWrite}
                  onChange={(read, speak, write) => setFormData(prev => ({
                    ...prev,
                    languagesRead: read,
                    languagesSpeak: speak,
                    languagesWrite: write,
                  }))}
                />
              </CardContent>
            </Card>

            {/* Address & Identification */}
            <Card>
              <CardHeader>
                <CardTitle>Address & Identification</CardTitle>
                <CardDescription>Location and identification details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currentResidenceZipCode">Zip Code</Label>
                    <Input
                      id="currentResidenceZipCode"
                      value={formData.currentResidenceZipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentResidenceZipCode: e.target.value }))}
                      placeholder="94102"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label htmlFor="passportNumber">Passport Number</Label>
                    <Input
                      id="passportNumber"
                      value={formData.passportNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, passportNumber: e.target.value }))}
                      placeholder="X12345678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sinLast4">SSN/SIN Last 4</Label>
                    <Input
                      id="sinLast4"
                      value={formData.sinLast4}
                      onChange={(e) => setFormData(prev => ({ ...prev, sinLast4: e.target.value.slice(0, 4) }))}
                      placeholder="1234"
                      maxLength={4}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="linkedinId">LinkedIn Profile ID</Label>
                  <Input
                    id="linkedinId"
                    value={formData.linkedinId}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedinId: e.target.value }))}
                    placeholder="john-doe-123456"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Documents Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Document Uploads</CardTitle>
                <CardDescription>Upload passport/visa/green card and driver's license copies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DocumentUploader
                  label="Passport/Visa/Green Card Copy"
                  value={formData.passportCopyUrl}
                  onChange={(url) => setFormData(prev => ({ ...prev, passportCopyUrl: url }))}
                />
                <DocumentUploader
                  label="Driver's License Copy"
                  value={formData.dlCopyUrl}
                  onChange={(url) => setFormData(prev => ({ ...prev, dlCopyUrl: url }))}
                />
              </CardContent>
            </Card>

            {/* Skills & Experience */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Experience Summary</CardTitle>
                <CardDescription>Professional background and capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Textarea
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="JavaScript, React, Node.js, Python, AWS"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Experience Summary</Label>
                  <Textarea
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="5 years of full-stack development experience..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="education">Education Summary</Label>
                  <Textarea
                    id="education"
                    value={formData.education}
                    onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                    placeholder="Bachelor's in Computer Science from MIT"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Passionate software engineer with expertise in..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 sticky bottom-0 bg-background py-4 border-t">
              <Button variant="outline" onClick={() => setLocation('/recruiter/search-candidates')}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={addCandidateMutation.isPending}>
                {addCandidateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Candidate'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components

interface LanguageProficiencySelectorProps {
  languagesRead: string[];
  languagesSpeak: string[];
  languagesWrite: string[];
  onChange: (read: string[], speak: string[], write: string[]) => void;
}

function LanguageProficiencySelector({ languagesRead, languagesSpeak, languagesWrite, onChange }: LanguageProficiencySelectorProps) {
  const [newLanguage, setNewLanguage] = useState('');
  
  const commonLanguages = ['English', 'Spanish', 'Mandarin', 'French', 'German', 'Japanese', 'Korean', 'Portuguese', 'Arabic', 'Hindi'];
  const allLanguages = [...new Set([...languagesRead, ...languagesSpeak, ...languagesWrite])];

  const handleAddLanguage = () => {
    if (newLanguage && !allLanguages.includes(newLanguage)) {
      onChange([...languagesRead, newLanguage], [...languagesSpeak, newLanguage], [...languagesWrite, newLanguage]);
      setNewLanguage('');
    }
  };

  const handleToggleProficiency = (language: string, type: 'read' | 'speak' | 'write') => {
    if (type === 'read') {
      const updated = languagesRead.includes(language) 
        ? languagesRead.filter(l => l !== language)
        : [...languagesRead, language];
      onChange(updated, languagesSpeak, languagesWrite);
    } else if (type === 'speak') {
      const updated = languagesSpeak.includes(language)
        ? languagesSpeak.filter(l => l !== language)
        : [...languagesSpeak, language];
      onChange(languagesRead, updated, languagesWrite);
    } else {
      const updated = languagesWrite.includes(language)
        ? languagesWrite.filter(l => l !== language)
        : [...languagesWrite, language];
      onChange(languagesRead, languagesSpeak, updated);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={newLanguage} onValueChange={setNewLanguage}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {commonLanguages.map(lang => (
              <SelectItem key={lang} value={lang}>{lang}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" onClick={handleAddLanguage}>Add</Button>
      </div>

      {allLanguages.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="grid grid-cols-4 gap-2 mb-3 text-sm font-medium">
            <div>Language</div>
            <div className="text-center">Read</div>
            <div className="text-center">Speak</div>
            <div className="text-center">Write</div>
          </div>
          {allLanguages.map(lang => (
            <div key={lang} className="grid grid-cols-4 gap-2 items-center py-2 border-t">
              <div>{lang}</div>
              <div className="flex justify-center">
                <Checkbox
                  checked={languagesRead.includes(lang)}
                  onCheckedChange={() => handleToggleProficiency(lang, 'read')}
                />
              </div>
              <div className="flex justify-center">
                <Checkbox
                  checked={languagesSpeak.includes(lang)}
                  onCheckedChange={() => handleToggleProficiency(lang, 'speak')}
                />
              </div>
              <div className="flex justify-center">
                <Checkbox
                  checked={languagesWrite.includes(lang)}
                  onCheckedChange={() => handleToggleProficiency(lang, 'write')}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface DocumentUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

function DocumentUploader({ label, value, onChange }: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'File must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

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

      // Upload to S3 via backend
      const response = await fetch('/api/trpc/candidates.uploadDocument', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64,
          filename: file.name,
          mimeType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const { result } = await response.json();
      onChange(result.data.url);

      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 border-2 border-dashed rounded-lg p-4">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileUpload}
          className="hidden"
          id={`upload-${label}`}
          disabled={isUploading}
        />
        <label htmlFor={`upload-${label}`} className="cursor-pointer block text-center">
          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
              <p className="text-sm">Uploading...</p>
            </div>
          ) : value ? (
            <div className="space-y-2">
              <Check className="w-8 h-8 mx-auto text-green-500" />
              <p className="text-sm font-medium">Document uploaded</p>
              <p className="text-xs text-muted-foreground">Click to change</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm">Click to upload</p>
              <p className="text-xs text-muted-foreground">Image or PDF, max 5MB</p>
            </div>
          )}
        </label>
      </div>
    </div>
  );
}
