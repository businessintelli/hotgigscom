import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, Loader2, CheckCircle2, User, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function QuickResumeUpload() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success">("idle");
  const [parsedData, setParsedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const addCandidateMutation = trpc.recruiter.addCandidateManually.useMutation({
    onSuccess: (data) => {
      setUploadStatus("success");
      setParsedData(data.parsedData);
      
      toast({
        title: "Candidate added successfully",
        description: data.parsed 
          ? "Resume parsed and profile created" 
          : "Candidate profile created",
      });

      // Invalidate queries
      utils.recruiter.searchCandidates.invalidate();
      utils.recruiter.getDashboardStats.invalidate();

      // Reset form after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);
    },
    onError: (error) => {
      setUploadStatus("idle");
      toast({
        title: "Failed to add candidate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setResumeFile(null);
    setCandidateName("");
    setCandidateEmail("");
    setUploadStatus("idle");
    setParsedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (file: File) => {
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!resumeFile) {
      toast({
        title: "No file selected",
        description: "Please select a resume file",
        variant: "destructive",
      });
      return;
    }

    if (!candidateName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter the candidate's name",
        variant: "destructive",
      });
      return;
    }

    if (!candidateEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter the candidate's email",
        variant: "destructive",
      });
      return;
    }

    setUploadStatus("uploading");

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(resumeFile);
      });

      // Submit
      addCandidateMutation.mutate({
        name: candidateName,
        email: candidateEmail,
        source: "quick-upload",
        resumeFile: {
          fileData: base64,
          fileName: resumeFile.name,
          mimeType: resumeFile.type,
        },
      });
    } catch (error) {
      setUploadStatus("idle");
      toast({
        title: "Failed to read file",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          Quick Resume Upload
        </CardTitle>
        <CardDescription>
          Upload a resume to quickly add a candidate from job fairs or networking events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadStatus === "success" && parsedData ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              <span className="font-semibold">Candidate Added Successfully!</span>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-700" />
                <span className="font-medium text-green-900">{candidateName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-700" />
                <span className="text-sm text-green-800">{candidateEmail}</span>
              </div>
              
              {parsedData.skills && parsedData.skills.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-green-900 mb-1">Extracted Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {parsedData.skills.slice(0, 5).map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {parsedData.skills.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{parsedData.skills.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {parsedData.totalExperienceYears && (
                <p className="text-sm text-green-800">
                  <span className="font-medium">Experience:</span> {parsedData.totalExperienceYears} years
                </p>
              )}
            </div>

            <Button onClick={resetForm} variant="outline" className="w-full">
              Upload Another Resume
            </Button>
          </div>
        ) : (
          <>
            {/* Drag and Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center transition-all
                ${isDragging 
                  ? "border-blue-500 bg-blue-50" 
                  : resumeFile 
                    ? "border-green-500 bg-green-50" 
                    : "border-slate-200 hover:border-blue-400"
                }
              `}
            >
              {resumeFile ? (
                <div className="space-y-2">
                  <FileText className="h-10 w-10 mx-auto text-green-600" />
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium text-green-900">{resumeFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResumeFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-green-700">
                    {(resumeFile.size / 1024).toFixed(0)} KB • Ready to upload
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="h-10 w-10 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-600 mb-2">
                    Drag and drop resume here, or click to browse
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    PDF or DOCX, max 5MB
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="quick-resume-upload"
                  />
                  <Label htmlFor="quick-resume-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>Choose File</span>
                    </Button>
                  </Label>
                </div>
              )}
            </div>

            {/* Candidate Info Fields */}
            {resumeFile && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="quick-name" className="text-sm">
                    Candidate Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quick-name"
                    placeholder="John Doe"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    disabled={uploadStatus === "uploading"}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quick-email" className="text-sm">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quick-email"
                    type="email"
                    placeholder="john@example.com"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    disabled={uploadStatus === "uploading"}
                  />
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={uploadStatus === "uploading"}
                  className="w-full"
                >
                  {uploadStatus === "uploading" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing Resume...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Add Candidate
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
