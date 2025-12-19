import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface WizardData {
  // Compensation Information
  salaryType?: "salary" | "hourly";
  currentSalary?: number;
  currentHourlyRate?: number;
  expectedSalary?: number;
  expectedHourlyRate?: number;
  
  // Work Authorization
  workAuthorization?: string;
  workAuthorizationEndDate?: Date;
  w2EmployerName?: string;
  nationality?: string;
  
  // Personal Information
  gender?: string;
  dateOfBirth?: Date;
  currentResidenceZipCode?: string;
  linkedinId?: string;
  
  // Highest Education
  highestEducation?: string;
  specialization?: string;
  highestDegreeStartDate?: Date;
  highestDegreeEndDate?: Date;
  
  // Employment History
  employmentHistory?: Array<{
    company: string;
    address: string;
    startDate: string;
    endDate: string;
  }>;
  
  // Language Proficiency
  languagesRead?: string[];
  languagesSpeak?: string[];
  languagesWrite?: string[];
  
  // Identification
  passportNumber?: string;
  sinLast4?: string;
  
  // Document Uploads
  passportCopyUrl?: string;
  dlCopyUrl?: string;
  
  // Cover Letter (for applications)
  coverLetter?: string;
}

interface CandidateWizardProps {
  initialData?: Partial<WizardData>;
  onComplete: (data: WizardData) => void;
  onCancel?: () => void;
  showCoverLetter?: boolean; // For job applications
  title?: string;
  description?: string;
}

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Chinese", 
  "Japanese", "Korean", "Arabic", "Hindi", "Portuguese", 
  "Russian", "Italian"
];

const EDUCATION_LEVELS = [
  "High School",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Professional Degree"
];

const WORK_AUTH_OPTIONS = [
  { value: "citizen", label: "US Citizen" },
  { value: "green-card", label: "Green Card Holder" },
  { value: "h1b", label: "H1B Visa" },
  { value: "opt", label: "OPT" },
  { value: "cpt", label: "CPT" },
  { value: "ead", label: "EAD" },
  { value: "requires-sponsorship", label: "Requires Sponsorship" }
];

export function CandidateWizard({
  initialData = {},
  onComplete,
  onCancel,
  showCoverLetter = false,
  title = "Additional Information Required",
  description = "Please provide the following information to complete your profile"
}: CandidateWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [employmentEntry, setEmploymentEntry] = useState({ company: "", address: "", startDate: "", endDate: "" });

  const totalSteps = showCoverLetter ? 7 : 6;

  const updateData = (field: keyof WizardData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleLanguage = (field: "languagesRead" | "languagesSpeak" | "languagesWrite", lang: string) => {
    const current = data[field] || [];
    const updated = current.includes(lang)
      ? current.filter(l => l !== lang)
      : [...current, lang];
    updateData(field, updated);
  };

  const addEmployment = () => {
    if (employmentEntry.company && employmentEntry.address) {
      const current = data.employmentHistory || [];
      updateData("employmentHistory", [...current, employmentEntry]);
      setEmploymentEntry({ company: "", address: "", startDate: "", endDate: "" });
    }
  };

  const removeEmployment = (index: number) => {
    const current = data.employmentHistory || [];
    updateData("employmentHistory", current.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all",
            i + 1 === currentStep ? "w-8 bg-primary" : "w-2 bg-muted"
          )}
        />
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="salaryType">Compensation Type *</Label>
        <Select value={data.salaryType} onValueChange={(value: "salary" | "hourly") => updateData("salaryType", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="salary">Annual Salary</SelectItem>
            <SelectItem value="hourly">Hourly Rate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.salaryType === "salary" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="currentSalary">Current Annual Salary (USD)</Label>
            <Input
              id="currentSalary"
              type="number"
              placeholder="e.g., 80000"
              value={data.currentSalary || ""}
              onChange={(e) => updateData("currentSalary", parseInt(e.target.value) || undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedSalary">Expected Annual Salary (USD)</Label>
            <Input
              id="expectedSalary"
              type="number"
              placeholder="e.g., 100000"
              value={data.expectedSalary || ""}
              onChange={(e) => updateData("expectedSalary", parseInt(e.target.value) || undefined)}
            />
          </div>
        </>
      )}

      {data.salaryType === "hourly" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="currentHourlyRate">Current Hourly Rate (USD)</Label>
            <Input
              id="currentHourlyRate"
              type="number"
              placeholder="e.g., 50"
              value={data.currentHourlyRate || ""}
              onChange={(e) => updateData("currentHourlyRate", parseInt(e.target.value) || undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedHourlyRate">Expected Hourly Rate (USD)</Label>
            <Input
              id="expectedHourlyRate"
              type="number"
              placeholder="e.g., 65"
              value={data.expectedHourlyRate || ""}
              onChange={(e) => updateData("expectedHourlyRate", parseInt(e.target.value) || undefined)}
            />
          </div>
        </>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="workAuthorization">Work Authorization *</Label>
        <Select value={data.workAuthorization} onValueChange={(value) => updateData("workAuthorization", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {WORK_AUTH_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data.workAuthorization && !["citizen", "green-card"].includes(data.workAuthorization) && (
        <div className="space-y-2">
          <Label>Work Authorization End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.workAuthorizationEndDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.workAuthorizationEndDate ? format(data.workAuthorizationEndDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={data.workAuthorizationEndDate || undefined}
              onSelect={(date) => updateData("workAuthorizationEndDate", date)}
            />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {data.workAuthorization === "h1b" && (
        <div className="space-y-2">
          <Label htmlFor="w2EmployerName">W2 Employer Name</Label>
          <Input
            id="w2EmployerName"
            placeholder="Current employer name"
            value={data.w2EmployerName || ""}
            onChange={(e) => updateData("w2EmployerName", e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nationality">Nationality *</Label>
        <Input
          id="nationality"
          placeholder="e.g., American, Indian, Chinese"
          value={data.nationality || ""}
          onChange={(e) => updateData("nationality", e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select value={data.gender} onValueChange={(value) => updateData("gender", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="non-binary">Non-Binary</SelectItem>
            <SelectItem value="prefer-not-to-say">Prefer Not to Say</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Date of Birth (MM/DD/YYYY) *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.dateOfBirth && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {data.dateOfBirth ? format(data.dateOfBirth, "MM/dd/yyyy") : "mm/dd/yyyy"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={data.dateOfBirth || undefined}
              onSelect={(date) => updateData("dateOfBirth", date)}
              captionLayout="dropdown-buttons"
              fromYear={1950}
              toYear={2010}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentResidenceZipCode">Current Residence Zip Code *</Label>
        <Input
          id="currentResidenceZipCode"
          placeholder="e.g., 10001"
          value={data.currentResidenceZipCode || ""}
          onChange={(e) => updateData("currentResidenceZipCode", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedinId">LinkedIn ID</Label>
        <Input
          id="linkedinId"
          placeholder="e.g., linkedin.com/in/yourname"
          value={data.linkedinId || ""}
          onChange={(e) => updateData("linkedinId", e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="highestEducation">Highest Education *</Label>
        <Select value={data.highestEducation} onValueChange={(value) => updateData("highestEducation", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select education level" />
          </SelectTrigger>
          <SelectContent>
            {EDUCATION_LEVELS.map(level => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialization">Specialization *</Label>
        <Input
          id="specialization"
          placeholder="e.g., Computer Science, Business"
          value={data.specialization || ""}
          onChange={(e) => updateData("specialization", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Degree Start Date (MM/DD/YYYY)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.highestDegreeStartDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.highestDegreeStartDate ? format(data.highestDegreeStartDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={data.highestDegreeStartDate || undefined}
                onSelect={(date) => updateData("highestDegreeStartDate", date)}
                captionLayout="dropdown-buttons"
                fromYear={1980}
                toYear={new Date().getFullYear()}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Degree End Date (MM/DD/YYYY)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.highestDegreeEndDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.highestDegreeEndDate ? format(data.highestDegreeEndDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={data.highestDegreeEndDate || undefined}
                onSelect={(date) => updateData("highestDegreeEndDate", date)}
                captionLayout="dropdown-buttons"
                fromYear={1980}
                toYear={new Date().getFullYear() + 10}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Recent Employment and Address</Label>
          <Button type="button" size="sm" variant="outline" onClick={addEmployment}>
            + Add Employment
          </Button>
        </div>

        {(data.employmentHistory || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No employment history added yet. Click "Add Employment" to add your work history.</p>
        ) : (
          <div className="space-y-2">
            {data.employmentHistory?.map((emp, idx) => (
              <Card key={idx}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{emp.company}</p>
                      <p className="text-sm text-muted-foreground">{emp.address}</p>
                      <p className="text-sm text-muted-foreground">{emp.startDate} - {emp.endDate}</p>
                    </div>
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeEmployment(idx)}>Remove</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Input
            placeholder="Company name"
            value={employmentEntry.company}
            onChange={(e) => setEmploymentEntry(prev => ({ ...prev, company: e.target.value }))}
          />
          <Input
            placeholder="Address"
            value={employmentEntry.address}
            onChange={(e) => setEmploymentEntry(prev => ({ ...prev, address: e.target.value }))}
          />
          <Input
            placeholder="Start date (MM/YYYY)"
            value={employmentEntry.startDate}
            onChange={(e) => setEmploymentEntry(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <Input
            placeholder="End date (MM/YYYY)"
            value={employmentEntry.endDate}
            onChange={(e) => setEmploymentEntry(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Languages you can Read</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(lang => (
            <Button
              key={lang}
              type="button"
              size="sm"
              variant={(data.languagesRead || []).includes(lang) ? "default" : "outline"}
              onClick={() => toggleLanguage("languagesRead", lang)}
            >
              {lang}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Languages you can Speak</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(lang => (
            <Button
              key={lang}
              type="button"
              size="sm"
              variant={(data.languagesSpeak || []).includes(lang) ? "default" : "outline"}
              onClick={() => toggleLanguage("languagesSpeak", lang)}
            >
              {lang}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Languages you can Write</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(lang => (
            <Button
              key={lang}
              type="button"
              size="sm"
              variant={(data.languagesWrite || []).includes(lang) ? "default" : "outline"}
              onClick={() => toggleLanguage("languagesWrite", lang)}
            >
              {lang}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="passportNumber">Passport Number</Label>
        <Input
          id="passportNumber"
          placeholder="Enter passport number"
          value={data.passportNumber || ""}
          onChange={(e) => updateData("passportNumber", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sinLast4">Last 4 digits of SIN</Label>
        <Input
          id="sinLast4"
          placeholder="1234"
          maxLength={4}
          value={data.sinLast4 || ""}
          onChange={(e) => updateData("sinLast4", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passportCopy">Passport / Green Card / Visa Copy (PDF or JPEG) *</Label>
        <div className="flex items-center gap-2">
          <Input
            id="passportCopy"
            type="file"
            accept=".pdf,.jpg,.jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // In real implementation, upload to S3 and get URL
                updateData("passportCopyUrl", `uploaded-${file.name}`);
              }
            }}
          />
        </div>
        {data.passportCopyUrl && (
          <p className="text-sm text-muted-foreground">✓ File uploaded</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dlCopy">Driver's License Copy (PDF or JPEG) *</Label>
        <div className="flex items-center gap-2">
          <Input
            id="dlCopy"
            type="file"
            accept=".pdf,.jpg,.jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // In real implementation, upload to S3 and get URL
                updateData("dlCopyUrl", `uploaded-${file.name}`);
              }
            }}
          />
        </div>
        {data.dlCopyUrl && (
          <p className="text-sm text-muted-foreground">✓ File uploaded</p>
        )}
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
        <Textarea
          id="coverLetter"
          placeholder="Add a cover letter for this application..."
          rows={10}
          value={data.coverLetter || ""}
          onChange={(e) => updateData("coverLetter", e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {renderStepIndicator()}

        <div className="min-h-[400px]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
          {currentStep === 7 && showCoverLetter && renderStep7()}
        </div>

        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={handleBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button type="button" onClick={handleNext}>
            {currentStep === totalSteps ? "Submit Application" : "Next"}
            {currentStep < totalSteps && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
