import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";

export interface EmploymentEntry {
  company: string;
  address: string;
  startDate: string;
  endDate: string;
}

export interface ExtendedCandidateInfo {
  workAuthorization?: string;
  workAuthorizationEndDate?: string;
  w2EmployerName?: string;
  nationality?: string;
  gender?: string;
  dateOfBirth?: string;
  highestEducation?: string;
  specialization?: string;
  highestDegreeStartDate?: string;
  highestDegreeEndDate?: string;
  employmentHistory?: EmploymentEntry[];
  languagesRead?: string[];
  languagesSpeak?: string[];
  languagesWrite?: string[];
  currentResidenceZipCode?: string;
  passportNumber?: string;
  sinLast4?: string;
  linkedinId?: string;
  passportCopyUrl?: string;
  dlCopyUrl?: string;
}

interface ExtendedCandidateInfoFormProps {
  data: ExtendedCandidateInfo;
  onChange: (data: ExtendedCandidateInfo) => void;
}

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Chinese", "Japanese", 
  "Korean", "Arabic", "Hindi", "Portuguese", "Russian", "Italian"
];

const WORK_AUTHORIZATION_OPTIONS = [
  "US Citizen",
  "Green Card",
  "H1B",
  "OPT",
  "CPT",
  "L1",
  "TN Visa",
  "Other"
];

const EDUCATION_LEVELS = [
  "High School",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Professional Degree"
];

const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-Binary",
  "Prefer not to say"
];

export default function ExtendedCandidateInfoForm({ data, onChange }: ExtendedCandidateInfoFormProps) {
  const { toast } = useToast();
  const [uploadingPassport, setUploadingPassport] = useState(false);
  const [uploadingDL, setUploadingDL] = useState(false);
  const uploadDocumentMutation = trpc.document.uploadDocument.useMutation();

  const updateField = (field: keyof ExtendedCandidateInfo, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addEmploymentEntry = () => {
    const newEntry: EmploymentEntry = {
      company: "",
      address: "",
      startDate: "",
      endDate: ""
    };
    updateField("employmentHistory", [...(data.employmentHistory || []), newEntry]);
  };

  const updateEmploymentEntry = (index: number, field: keyof EmploymentEntry, value: string) => {
    const updated = [...(data.employmentHistory || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField("employmentHistory", updated);
  };

  const removeEmploymentEntry = (index: number) => {
    const updated = [...(data.employmentHistory || [])];
    updated.splice(index, 1);
    updateField("employmentHistory", updated);
  };

  const toggleLanguage = (category: 'languagesRead' | 'languagesSpeak' | 'languagesWrite', language: string) => {
    const current = data[category] || [];
    const updated = current.includes(language)
      ? current.filter(l => l !== language)
      : [...current, language];
    updateField(category, updated);
  };

  const handleFileUpload = async (file: File, type: 'passport' | 'dl') => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or JPEG file",
        variant: "destructive",
      });
      return;
    }

    try {
      if (type === 'passport') setUploadingPassport(true);
      else setUploadingDL(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result?.toString().split(',')[1];
        if (!base64) return;

        try {
          const result = await uploadDocumentMutation.mutateAsync({
            data: base64,
            filename: file.name,
            mimeType: file.type,
            documentType: type,
          });

          if (result.success && result.url) {
            updateField(type === 'passport' ? 'passportCopyUrl' : 'dlCopyUrl', result.url);
            toast({
              title: "Upload successful",
              description: `${type === 'passport' ? 'Passport' : 'Driver License'} uploaded successfully`,
            });
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (err: any) {
          toast({
            title: "Upload failed",
            description: err.message || "Failed to upload document",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      if (type === 'passport') setUploadingPassport(false);
      else setUploadingDL(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Work Authorization */}
      <Card>
        <CardHeader>
          <CardTitle>Work Authorization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workAuthorization">Work Authorization *</Label>
              <Select
                value={data.workAuthorization}
                onValueChange={(value) => updateField('workAuthorization', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_AUTHORIZATION_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="workAuthorizationEndDate">Work Authorization End Date</Label>
              <Input
                id="workAuthorizationEndDate"
                type="date"
                value={data.workAuthorizationEndDate || ''}
                onChange={(e) => updateField('workAuthorizationEndDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="w2EmployerName">W2 Employer Name</Label>
              <Input
                id="w2EmployerName"
                value={data.w2EmployerName || ''}
                onChange={(e) => updateField('w2EmployerName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="nationality">Nationality *</Label>
              <Input
                id="nationality"
                value={data.nationality || ''}
                onChange={(e) => updateField('nationality', e.target.value)}
                placeholder="e.g., American, Indian, Chinese"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={data.gender}
                onValueChange={(value) => updateField('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth (MM/DD/YYYY) *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={data.dateOfBirth || ''}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="currentResidenceZipCode">Current Residence Zip Code *</Label>
              <Input
                id="currentResidenceZipCode"
                value={data.currentResidenceZipCode || ''}
                onChange={(e) => updateField('currentResidenceZipCode', e.target.value)}
                placeholder="e.g., 10001"
              />
            </div>
            <div>
              <Label htmlFor="linkedinId">LinkedIn ID</Label>
              <Input
                id="linkedinId"
                value={data.linkedinId || ''}
                onChange={(e) => updateField('linkedinId', e.target.value)}
                placeholder="e.g., linkedin.com/in/yourname"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle>Highest Education</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="highestEducation">Highest Education *</Label>
              <Select
                value={data.highestEducation}
                onValueChange={(value) => updateField('highestEducation', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_LEVELS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="specialization">Specialization *</Label>
              <Input
                id="specialization"
                value={data.specialization || ''}
                onChange={(e) => updateField('specialization', e.target.value)}
                placeholder="e.g., Computer Science, Business"
              />
            </div>
            <div>
              <Label htmlFor="highestDegreeStartDate">Degree Start Date (MM/DD/YYYY)</Label>
              <Input
                id="highestDegreeStartDate"
                type="date"
                value={data.highestDegreeStartDate || ''}
                onChange={(e) => updateField('highestDegreeStartDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="highestDegreeEndDate">Degree End Date (MM/DD/YYYY)</Label>
              <Input
                id="highestDegreeEndDate"
                type="date"
                value={data.highestDegreeEndDate || ''}
                onChange={(e) => updateField('highestDegreeEndDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Employment and Address</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEmploymentEntry}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employment
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {(data.employmentHistory || []).map((entry, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Employment {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEmploymentEntry(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={entry.company}
                    onChange={(e) => updateEmploymentEntry(index, 'company', e.target.value)}
                    placeholder="e.g., Google Inc."
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={entry.address}
                    onChange={(e) => updateEmploymentEntry(index, 'address', e.target.value)}
                    placeholder="e.g., 1600 Amphitheatre Parkway, Mountain View, CA"
                  />
                </div>
                <div>
                  <Label>Start Date (MM/DD/YYYY) *</Label>
                  <Input
                    type="date"
                    value={entry.startDate}
                    onChange={(e) => updateEmploymentEntry(index, 'startDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date (MM/DD/YYYY)</Label>
                  <Input
                    type="date"
                    value={entry.endDate}
                    onChange={(e) => updateEmploymentEntry(index, 'endDate', e.target.value)}
                    placeholder="Leave empty if current"
                  />
                </div>
              </div>
            </div>
          ))}
          {(!data.employmentHistory || data.employmentHistory.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-4">
              No employment history added yet. Click "Add Employment" to add your work history.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle>Language Proficiency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {['Read', 'Speak', 'Write'].map((skill) => {
            const key = `languages${skill}` as 'languagesRead' | 'languagesSpeak' | 'languagesWrite';
            return (
              <div key={skill}>
                <Label className="mb-2 block">Languages you can {skill}</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <Button
                      key={lang}
                      type="button"
                      variant={(data[key] || []).includes(lang) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleLanguage(key, lang)}
                    >
                      {lang}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Identification */}
      <Card>
        <CardHeader>
          <CardTitle>Identification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passportNumber">Passport Number</Label>
              <Input
                id="passportNumber"
                value={data.passportNumber || ''}
                onChange={(e) => updateField('passportNumber', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sinLast4">Last 4 digits of SIN</Label>
              <Input
                id="sinLast4"
                value={data.sinLast4 || ''}
                onChange={(e) => updateField('sinLast4', e.target.value.slice(0, 4))}
                maxLength={4}
                placeholder="1234"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Uploads */}
      <Card>
        <CardHeader>
          <CardTitle>Document Uploads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Passport / Green Card / Visa Copy (PDF or JPEG) *</Label>
              <div className="mt-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'passport');
                  }}
                  disabled={uploadingPassport}
                />
                {data.passportCopyUrl && (
                  <p className="text-sm text-green-600 mt-1">✓ Document uploaded</p>
                )}
              </div>
            </div>
            <div>
              <Label>Driver's License Copy (PDF or JPEG) *</Label>
              <div className="mt-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'dl');
                  }}
                  disabled={uploadingDL}
                />
                {data.dlCopyUrl && (
                  <p className="text-sm text-green-600 mt-1">✓ Document uploaded</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
