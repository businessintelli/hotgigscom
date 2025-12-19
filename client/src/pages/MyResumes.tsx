import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import CandidateLayout from '@/components/CandidateLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FileText, Upload, Star, Trash2, Download, Plus, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

export default function MyResumes() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Get candidate profile
  const { data: candidateProfile } = trpc.candidate.getProfile.useQuery(undefined, {
    enabled: !!user,
  });

  // Get resume profiles
  const { data: resumeProfiles = [], refetch: refetchProfiles } = trpc.resumeProfile.getResumeProfiles.useQuery(
    { candidateId: candidateProfile?.id || 0 },
    { enabled: !!candidateProfile?.id }
  );

  const utils = trpc.useUtils();

  // Mutations
  const createProfileMutation = trpc.resumeProfile.createResumeProfile.useMutation({
    onSuccess: (result) => {
      console.log('[MyResumes] onSuccess called with result:', result);
      console.log('[MyResumes] result.parsedData exists?', !!result.parsedData);
      console.log('[MyResumes] profileName:', profileName);
      console.log('[MyResumes] candidateProfile?.id:', candidateProfile?.id);
      
      setIsUploading(false);
      
      // Redirect to review/edit page with parsed data
      if (result.parsedData) {
        console.log('[MyResumes] Parsed data found, preparing redirect');
        toast.success('Resume parsed! Redirecting to review page...');
        
        const dataToStore = {
          parsedData: result.parsedData,
          resumeUrl: result.url,
          fileKey: result.fileKey,
          fileName: result.fileName,
          profileName: profileName.trim(),
          isDefault: result.isDefault,
          candidateId: candidateProfile?.id,
          scores: result.scores,
        };
        
        console.log('[MyResumes] Storing data in sessionStorage:', dataToStore);
        sessionStorage.setItem('resumeReviewData', JSON.stringify(dataToStore));
        console.log('[MyResumes] Data stored, closing dialog');
        
        setUploadDialogOpen(false);
        console.log('[MyResumes] Dialog closed, setting timeout for redirect');
        
        setTimeout(() => {
          console.log('[MyResumes] Executing redirect to /candidate/resume-review');
          setLocation('/candidate/resume-review');
          console.log('[MyResumes] setLocation called');
        }, 100);
      } else {
        console.log('[MyResumes] No parsed data, showing success message');
        toast.success('Resume uploaded successfully!');
        setUploadDialogOpen(false);
        setProfileName('');
        setSelectedFile(null);
        refetchProfiles();
      }
    },
    onError: (error) => {
      console.error('[MyResumes] onError called:', error);
      toast.error(error.message || 'Failed to upload resume profile');
      setIsUploading(false);
    },
  });

  const setDefaultMutation = trpc.resumeProfile.setDefaultResumeProfile.useMutation({
    onSuccess: () => {
      toast.success('Default profile updated');
      refetchProfiles();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to set default profile');
    },
  });

  const deleteProfileMutation = trpc.resumeProfile.deleteResumeProfile.useMutation({
    onSuccess: () => {
      toast.success('Resume profile deleted');
      refetchProfiles();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete profile');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF or DOCX file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    console.log('[handleUpload] Starting upload process');
    console.log('[handleUpload] selectedFile:', selectedFile?.name);
    console.log('[handleUpload] profileName:', profileName);
    console.log('[handleUpload] candidateProfile:', candidateProfile?.id);
    
    if (!selectedFile || !profileName.trim() || !candidateProfile) {
      console.log('[handleUpload] Missing required fields, aborting');
      return;
    }

    setIsUploading(true);
    console.log('[handleUpload] Set isUploading to true');
    
    try {
      console.log('[handleUpload] Reading file...');
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('[handleUpload] File read complete');
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          console.error('[handleUpload] File read error');
          reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(selectedFile);
      });
      
      console.log('[handleUpload] Calling mutation with data');
      // Call mutation - onSuccess callback will handle the redirect
      createProfileMutation.mutate({
        candidateId: candidateProfile.id,
        profileName: profileName.trim(),
        fileData: base64Data,
        fileName: selectedFile.name,
      });
      console.log('[handleUpload] Mutation called');
    } catch (error) {
      console.error('[handleUpload] Error:', error);
      toast.error('Failed to process file');
      setIsUploading(false);
    }
  };

  const handleSetDefault = (profileId: number) => {
    if (!candidateProfile) return;
    setDefaultMutation.mutate({
      candidateId: candidateProfile.id,
      profileId,
    });
  };

  const handleDelete = (profileId: number) => {
    deleteProfileMutation.mutate({ id: profileId });
  };

  const canAddMore = resumeProfiles.length < 5;

  return (
    <CandidateLayout title="My Resumes">
      <div className="container mx-auto py-8">
        <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Resumes</h1>
            <p className="text-muted-foreground mt-2">
              Manage up to 5 different resume profiles for different job applications
            </p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canAddMore}>
                <Plus className="mr-2 h-4 w-4" />
                Add Resume Profile
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Resume</DialogTitle>
                <DialogDescription>
                  Upload a resume and we'll automatically parse it with AI to extract skills, experience, and more.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="profileName">Profile Name</Label>
                  <Input
                    id="profileName"
                    placeholder="e.g., Software Engineer, Full Stack Developer"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Resume File (PDF or DOCX)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileSelect}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !profileName.trim() || isUploading}
                >
                  {isUploading ? 'Parsing...' : 'Upload with AI Parsing'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profile limit indicator */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(resumeProfiles.length / 5) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {resumeProfiles.length} / 5 profiles
            </span>
          </div>
        </div>

        {/* Resume profiles list */}
        {resumeProfiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resume profiles yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Upload your first resume profile to get started
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {resumeProfiles.map((profile: any) => (
              <Card key={profile.id} className={profile.isDefault ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{profile.profileName}</CardTitle>
                        {profile.isDefault && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span>📄 {profile.resumeFilename}</span>
                          <span>
                            📅 Uploaded {new Date(profile.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {!profile.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(profile.id)}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Set as Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Resume Profile?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{profile.profileName}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(profile.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                {profile.parsedData && (
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>AI-parsed and ready to use</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Info card */}
        <Card className="mt-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">💡 Tips for Managing Resume Profiles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• Create different profiles for different types of jobs (e.g., "Frontend Developer", "Full Stack Engineer")</p>
            <p>• Your default profile will be used when you apply for jobs unless you select a different one</p>
            <p>• All resumes are automatically parsed with AI to extract your information</p>
            <p>• You can have up to 5 different resume profiles</p>
            <p>• Supported formats: PDF and DOCX (max 10MB)</p>
          </CardContent>
        </Card>
        </div>
      </div>
    </CandidateLayout>
  );
}
