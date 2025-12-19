import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface AdditionalInfoFieldsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Chinese", 
  "Japanese", "Korean", "Arabic", "Hindi", "Portuguese", 
  "Russian", "Italian"
];

const COMPENSATION_TYPES = [
  "W2 Full-time",
  "C2C",
  "1099",
  "W2 Contract",
  "Permanent"
];

const WORK_AUTHORIZATION_TYPES = [
  "US Citizen",
  "Green Card",
  "H1B",
  "EAD",
  "TN Visa",
  "L1 Visa",
  "OPT",
  "CPT",
  "Other"
];

const EDUCATION_LEVELS = [
  "High School",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate (PhD)",
  "Professional Degree"
];

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

export function AdditionalInfoFields({ formData, onChange, errors = {} }: AdditionalInfoFieldsProps) {
  const [employmentHistory, setEmploymentHistory] = useState<Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    address: string;
  }>>([]);

  const toggleLanguage = (category: 'read' | 'speak' | 'write', language: string) => {
    const currentLangs = formData[`languages${category.charAt(0).toUpperCase() + category.slice(1)}`] || [];
    const newLangs = currentLangs.includes(language)
      ? currentLangs.filter((l: string) => l !== language)
      : [...currentLangs, language];
    onChange(`languages${category.charAt(0).toUpperCase() + category.slice(1)}`, newLangs);
  };

  const addEmployment = () => {
    setEmploymentHistory([...employmentHistory, {
      company: "",
      title: "",
      startDate: "",
      endDate: "",
      address: ""
    }]);
  };

  const removeEmployment = (index: number) => {
    const newHistory = employmentHistory.filter((_, i) => i !== index);
    setEmploymentHistory(newHistory);
    onChange("employmentHistory", JSON.stringify(newHistory));
  };

  const updateEmployment = (index: number, field: string, value: string) => {
    const newHistory = [...employmentHistory];
    newHistory[index] = { ...newHistory[index], [field]: value };
    setEmploymentHistory(newHistory);
    onChange("employmentHistory", JSON.stringify(newHistory));
  };

  return (
    <div className="space-y-8">
      {/* Compensation Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Compensation Information</h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="compensationType">
              Compensation Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.compensationType || ""}
              onValueChange={(value) => onChange("compensationType", value)}
            >
              <SelectTrigger id="compensationType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {COMPENSATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.compensationType && (
              <p className="text-sm text-red-500 mt-1">{errors.compensationType}</p>
            )}
          </div>
        </div>
      </div>

      {/* Work Authorization */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Work Authorization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="workAuthorization">
              Work Authorization <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.workAuthorization || ""}
              onValueChange={(value) => onChange("workAuthorization", value)}
            >
              <SelectTrigger id="workAuthorization">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {WORK_AUTHORIZATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.workAuthorization && (
              <p className="text-sm text-red-500 mt-1">{errors.workAuthorization}</p>
            )}
          </div>

          <div>
            <Label htmlFor="workAuthorizationEndDate">Work Authorization End Date</Label>
            <Input
              id="workAuthorizationEndDate"
              type="date"
              value={formData.workAuthorizationEndDate || ""}
              onChange={(e) => onChange("workAuthorizationEndDate", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="w2EmployerName">W2 Employer Name</Label>
            <Input
              id="w2EmployerName"
              placeholder="Enter employer name"
              value={formData.w2EmployerName || ""}
              onChange={(e) => onChange("w2EmployerName", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="nationality">
              Nationality <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nationality"
              placeholder="e.g., American, Indian, Chinese"
              value={formData.nationality || ""}
              onChange={(e) => onChange("nationality", e.target.value)}
            />
            {errors.nationality && (
              <p className="text-sm text-red-500 mt-1">{errors.nationality}</p>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender || ""}
              onValueChange={(value) => onChange("gender", value)}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {gender}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dateOfBirth">
              Date of Birth (MM/DD/YYYY) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth || ""}
              onChange={(e) => onChange("dateOfBirth", e.target.value)}
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          <div>
            <Label htmlFor="currentResidenceZipCode">
              Current Residence Zip Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="currentResidenceZipCode"
              placeholder="e.g., 10001"
              value={formData.currentResidenceZipCode || ""}
              onChange={(e) => onChange("currentResidenceZipCode", e.target.value)}
            />
            {errors.currentResidenceZipCode && (
              <p className="text-sm text-red-500 mt-1">{errors.currentResidenceZipCode}</p>
            )}
          </div>

          <div>
            <Label htmlFor="linkedinId">LinkedIn ID</Label>
            <Input
              id="linkedinId"
              placeholder="e.g., linkedin.com/in/yourname"
              value={formData.linkedinId || ""}
              onChange={(e) => onChange("linkedinId", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Highest Education */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Highest Education</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="highestEducation">
              Highest Education <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.highestEducation || ""}
              onValueChange={(value) => onChange("highestEducation", value)}
            >
              <SelectTrigger id="highestEducation">
                <SelectValue placeholder="Select education level" />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.highestEducation && (
              <p className="text-sm text-red-500 mt-1">{errors.highestEducation}</p>
            )}
          </div>

          <div>
            <Label htmlFor="specialization">
              Specialization <span className="text-red-500">*</span>
            </Label>
            <Input
              id="specialization"
              placeholder="e.g., Computer Science, Business"
              value={formData.specialization || ""}
              onChange={(e) => onChange("specialization", e.target.value)}
            />
            {errors.specialization && (
              <p className="text-sm text-red-500 mt-1">{errors.specialization}</p>
            )}
          </div>

          <div>
            <Label htmlFor="degreeStartDate">Degree Start Date (MM/DD/YYYY)</Label>
            <Input
              id="degreeStartDate"
              type="date"
              value={formData.degreeStartDate || ""}
              onChange={(e) => onChange("degreeStartDate", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="degreeEndDate">Degree End Date (MM/DD/YYYY)</Label>
            <Input
              id="degreeEndDate"
              type="date"
              value={formData.degreeEndDate || ""}
              onChange={(e) => onChange("degreeEndDate", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Recent Employment and Address */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Employment and Address</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEmployment}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employment
          </Button>
        </div>
        
        {employmentHistory.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8 border border-dashed rounded-lg">
            No employment history added yet. Click "Add Employment" to add your work history.
          </p>
        ) : (
          <div className="space-y-4">
            {employmentHistory.map((employment, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => removeEmployment(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Company Name"
                    value={employment.company}
                    onChange={(e) => updateEmployment(index, "company", e.target.value)}
                  />
                  <Input
                    placeholder="Job Title"
                    value={employment.title}
                    onChange={(e) => updateEmployment(index, "title", e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={employment.startDate}
                    onChange={(e) => updateEmployment(index, "startDate", e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={employment.endDate}
                    onChange={(e) => updateEmployment(index, "endDate", e.target.value)}
                  />
                  <Input
                    placeholder="Address"
                    className="md:col-span-2"
                    value={employment.address}
                    onChange={(e) => updateEmployment(index, "address", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Language Proficiency */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Language Proficiency</h3>
        
        <div className="space-y-3">
          <div>
            <Label>Languages you can Read</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {LANGUAGES.map((lang) => (
                <Button
                  key={lang}
                  type="button"
                  variant={(formData.languagesRead || []).includes(lang) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleLanguage('read', lang)}
                >
                  {lang}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Languages you can Speak</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {LANGUAGES.map((lang) => (
                <Button
                  key={lang}
                  type="button"
                  variant={(formData.languagesSpeak || []).includes(lang) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleLanguage('speak', lang)}
                >
                  {lang}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Languages you can Write</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {LANGUAGES.map((lang) => (
                <Button
                  key={lang}
                  type="button"
                  variant={(formData.languagesWrite || []).includes(lang) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleLanguage('write', lang)}
                >
                  {lang}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Identification */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Identification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="passportNumber">Passport Number</Label>
            <Input
              id="passportNumber"
              placeholder="Enter passport number"
              value={formData.passportNumber || ""}
              onChange={(e) => onChange("passportNumber", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="sinLast4">Last 4 digits of SIN</Label>
            <Input
              id="sinLast4"
              placeholder="1234"
              maxLength={4}
              value={formData.sinLast4 || ""}
              onChange={(e) => onChange("sinLast4", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Document Uploads */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Document Uploads</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="passportCopy">
              Passport / Green Card / Visa Copy (PDF or JPEG) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="passportCopy"
              type="file"
              accept=".pdf,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onChange("passportCopyFile", file);
              }}
            />
            {errors.passportCopy && (
              <p className="text-sm text-red-500 mt-1">{errors.passportCopy}</p>
            )}
          </div>

          <div>
            <Label htmlFor="dlCopy">
              Driver's License Copy (PDF or JPEG) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dlCopy"
              type="file"
              accept=".pdf,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onChange("dlCopyFile", file);
              }}
            />
            {errors.dlCopy && (
              <p className="text-sm text-red-500 mt-1">{errors.dlCopy}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
