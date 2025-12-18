import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Upload, X, FileText, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AddCandidateDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function AddCandidateDialog({ trigger, onSuccess }: AddCandidateDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [source, setSource] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreview, setResumePreview] = useState<string>("");
  const [parsedData, setParsedData] = useState<any>(null);
  
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const addCandidateMutation = trpc.recruiter.addCandidateManually.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Candidate added successfully",
        description: data.parsed 
          ? "Resume was parsed and profile auto-filled" 
          : "Candidate profile created with manual data",
      });
      
      if (data.parsedData) {
        setParsedData(data.parsedData);
      }
      
      // Reset form
      resetForm();
      
      // Invalidate queries to refresh candidate list
      utils.recruiter.searchCandidates.invalidate();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close dialog after showing parsed data for 2 seconds
      if (data.parsed) {
        setTimeout(() => {
          setOpen(false);
          setParsedData(null);
        }, 3000);
      } else {
        setOpen(false);
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to add candidate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhoneNumber("");
    setTitle("");
    setLocation("");
    setSkills("");
    setExperience("");
    setEducation("");
    setLinkedinUrl("");
    setSource("");
    setResumeFile(null);
    setResumePreview("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or DOCX file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Resume must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setResumeFile(file);
    setResumePreview(file.name);
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumePreview("");
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter the candidate's name",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter the candidate's email",
        variant: "destructive",
      });
      return;
    }

    // Convert resume file to base64 if provided
    let resumeData: { fileData: string; fileName: string; mimeType: string } | undefined;
    
    if (resumeFile) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(resumeFile);
        });
        
        resumeData = {
          fileData: base64,
          fileName: resumeFile.name,
          mimeType: resumeFile.type,
        };
      } catch (error) {
        toast({
          title: "Failed to read resume file",
          description: "Please try again",
          variant: "destructive",
        });
        return;
      }
    }

    // Submit form
    addCandidateMutation.mutate({
      name,
      email,
      phoneNumber: phoneNumber || undefined,
      title: title || undefined,
      location: location || undefined,
      skills: skills || undefined,
      experience: experience || undefined,
      education: education || undefined,
      linkedinUrl: linkedinUrl || undefined,
      source: source || undefined,
      resumeFile: resumeData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Candidate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Candidate</DialogTitle>
          <DialogDescription>
            Manually add a candidate or upload their resume for automatic parsing
          </DialogDescription>
        </DialogHeader>

        {parsedData ? (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Resume Parsed Successfully</h3>
              </div>
              <div className="space-y-2 text-sm">
                {parsedData.skills && parsedData.skills.length > 0 && (
                  <div>
                    <span className="font-medium">Skills:</span>{" "}
                    <span className="text-muted-foreground">{parsedData.skills.join(", ")}</span>
                  </div>
                )}
                {parsedData.totalExperienceYears && (
                  <div>
                    <span className="font-medium">Experience:</span>{" "}
                    <span className="text-muted-foreground">{parsedData.totalExperienceYears} years</span>
                  </div>
                )}
                {parsedData.education && parsedData.education.length > 0 && (
                  <div>
                    <span className="font-medium">Education:</span>{" "}
                    <span className="text-muted-foreground">
                      {parsedData.education[0]?.degree} from {parsedData.education[0]?.institution}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 py-4">
            {/* Resume Upload Section */}
            <div className="space-y-2">
              <Label>Resume (Optional)</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                {resumePreview ? (
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">{resumePreview}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeResume}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600 mb-2">
                      Upload resume to auto-fill profile (PDF or DOCX, max 5MB)
                    </p>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="resume-upload"
                    />
                    <Label htmlFor="resume-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>Choose File</span>
                      </Button>
                    </Label>
                  </div>
                )}
              </div>
              {resumeFile && (
                <p className="text-xs text-blue-600">
                  ✓ Resume will be parsed automatically to fill in profile details
                </p>
              )}
            </div>

            {/* Required Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  placeholder="Software Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  placeholder="e.g., Job Fair, Referral, LinkedIn"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <Input
                id="skills"
                placeholder="React, Node.js, TypeScript (comma-separated)"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Experience</Label>
              <Textarea
                id="experience"
                placeholder="Brief summary of work experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Education</Label>
              <Input
                id="education"
                placeholder="Bachelor's in Computer Science, MIT"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                placeholder="https://linkedin.com/in/johndoe"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
              setParsedData(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addCandidateMutation.isPending || !!parsedData}
          >
            {addCandidateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Candidate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
