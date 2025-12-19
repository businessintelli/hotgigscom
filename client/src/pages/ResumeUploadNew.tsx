import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, FileText, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function ResumeUploadNew() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const createProfileMutation = trpc.resumeProfile.createResumeProfile.useMutation();
  
  // Get candidate profile
  const { data: candidate } = trpc.candidate.getCandidateByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        toast.error("File size must be less than 16MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !profileName.trim()) {
      toast.error("Please provide both profile name and resume file");
      return;
    }

    setIsUploading(true);
    console.log("[ResumeUploadNew] Starting upload...");

    try {
      const reader = new FileReader();
      
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      console.log("[ResumeUploadNew] File read complete, calling mutation...");

      if (!candidate?.id) {
        toast.error("Candidate profile not found");
        return;
      }

      const result = await createProfileMutation.mutateAsync({
        candidateId: candidate.id,
        profileName: profileName.trim(),
        fileName: selectedFile.name,
        fileData,
      });
      
      console.log("[ResumeUploadNew] Mutation result:", result);

      if (result.success && result.id) {
        toast.success("Resume uploaded and parsed successfully!");
        
        console.log("[ResumeUploadNew] Redirecting to edit page with ID:", result.id);

        // Redirect to edit page with the database ID
        setTimeout(() => {
          setLocation(`/candidate/resume-edit/${result.id}`);
        }, 500);
      } else {
        toast.error("Failed to upload resume");
      }
    } catch (error: any) {
      console.error("[ResumeUploadNew] Upload error:", error);
      console.error("[ResumeUploadNew] Error details:", JSON.stringify(error, null, 2));
      const errorMessage = error?.message || error?.data?.message || error?.shape?.message || "Failed to upload resume";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Resume
          </CardTitle>
          <CardDescription>
            Upload your resume and we'll automatically parse it with AI to extract skills, experience, and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profileName">Profile Name</Label>
            <Input
              id="profileName"
              placeholder="e.g., Software Engineer, Full Stack Developer"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              Give this resume profile a descriptive name to help you manage multiple versions
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Resume File (PDF or DOCX)</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/candidate/my-resumes")}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !profileName.trim() || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Parse with AI
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
