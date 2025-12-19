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
  const [parsedResumeData, setParsedResumeData] = useState<any>(null);
  const [resumeUrl, setResumeUrl] = useState<string>('');
  const [showResumeReviewModal, setShowResumeReviewModal] = useState(false);
  
  // Additional wizard fields
  const [residenceZip, setResidenceZip] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [workAuthorization, setWorkAuthorization] = useState('');
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  const [noticePeriod, setNoticePeriod] = useState('');

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
  const uploadResumeMutation = trpc.candidate.uploadResume.useMutation({
    onSuccess: (result) => {
      setIsUploading(false);
      toast.success('Resume parsed successfully! Please review and confirm.');
      
      // Store parsed data, URL, and show review modal
      setParsedResumeData(result.parsedData);
      setResumeUrl(result.url);
      setShowResumeReviewModal(true);
      setUploadDialogOpen(false);
      
      // Pre-fill wizard fields from parsed data if available
      if (result.parsedData?.personalInfo) {
        setLinkedinUrl(result.parsedData.personalInfo.linkedin || '');
      }
    },
    onError: (error) => {
      console.error('[MyResumes] onError called:', error);
      toast.error(error.message || 'Failed to upload resume profile');
      setIsUploading(false);
    },
  });

  const saveResumeAfterReviewMutation = trpc.candidate.saveResumeAfterReview.useMutation({
    onSuccess: () => {
      toast.success('Resume saved successfully!');
      setShowResumeReviewModal(false);
      refetchProfiles();
      utils.candidate.getProfile.invalidate();
      // Reset form
      setProfileName('');
      setSelectedFile(null);
      setParsedResumeData(null);
      setResumeUrl('');
      // Reset wizard fields
      setResidenceZip('');
      setLinkedinUrl('');
      setGender('');
      setDateOfBirth('');
      setWorkAuthorization('');
      setSalaryExpectation('');
      setWillingToRelocate(false);
      setNoticePeriod('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save resume');
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
    console.log('[handleUpload] TIMESTAMP: 2025-12-19-09:07:00 - CODE IS FRESH!');
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
      
      // Call uploadResume mutation with skipAutoSave to get parsed data without saving
      uploadResumeMutation.mutate({
        candidateId: candidateProfile.id,
        fileData: base64Data,
        fileName: selectedFile.name,
        autoFill: true, // Enable AI parsing
        skipAutoSave: true, // Don't save yet, show review modal first
      });
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
  
  const handleConfirmResume = () => {
    if (!candidateProfile || !parsedResumeData || !resumeUrl || !selectedFile) {
      toast.error('Missing required data');
      return;
    }
    
    saveResumeAfterReviewMutation.mutate({
      candidateId: candidateProfile.id,
      resumeUrl,
      resumeFilename: selectedFile.name,
      parsedData: parsedResumeData,
      additionalData: {
        residenceZip: residenceZip || undefined,
        linkedinUrl: linkedinUrl || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        workAuthorization: workAuthorization || undefined,
        salaryExpectation: salaryExpectation ? parseInt(salaryExpectation) : undefined,
        willingToRelocate,
        noticePeriod: noticePeriod || undefined,
      },
    });
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

        {/* Review Modal with Wizard Fields */}
        {showResumeReviewModal && parsedResumeData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Review & Complete Your Resume Profile
                </CardTitle>
                <CardDescription>
                  AI has extracted information from your resume. Please review, edit if needed, and fill in additional details before saving.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information - Read Only Display */}
                {parsedResumeData.personalInfo && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Personal Information (Extracted)</h3>
                    <div className="grid grid-cols-2 gap-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      {parsedResumeData.personalInfo.name && (
                        <div>
                          <Label className="text-xs text-gray-600">Name</Label>
                          <p className="font-medium">{parsedResumeData.personalInfo.name}</p>
                        </div>
                      )}
                      {parsedResumeData.personalInfo.email && (
                        <div>
                          <Label className="text-xs text-gray-600">Email</Label>
                          <p className="font-medium">{parsedResumeData.personalInfo.email}</p>
                        </div>
                      )}
                      {parsedResumeData.personalInfo.phone && (
                        <div>
                          <Label className="text-xs text-gray-600">Phone</Label>
                          <p className="font-medium">{parsedResumeData.personalInfo.phone}</p>
                        </div>
                      )}
                      {parsedResumeData.personalInfo.location && (
                        <div>
                          <Label className="text-xs text-gray-600">Location</Label>
                          <p className="font-medium">{parsedResumeData.personalInfo.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Details - Editable Wizard Fields */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Additional Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="residenceZip">Residence ZIP Code</Label>
                      <Input
                        id="residenceZip"
                        value={residenceZip}
                        onChange={(e) => setResidenceZip(e.target.value)}
                        placeholder="e.g., 94105"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                      <Input
                        id="linkedinUrl"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="workAuthorization">Work Authorization</Label>
                      <select
                        id="workAuthorization"
                        value={workAuthorization}
                        onChange={(e) => setWorkAuthorization(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select...</option>
                        <option value="us-citizen">US Citizen</option>
                        <option value="green-card">Green Card Holder</option>
                        <option value="h1b">H1B Visa</option>
                        <option value="opt">OPT</option>
                        <option value="cpt">CPT</option>
                        <option value="need-sponsorship">Need Sponsorship</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="salaryExpectation">Salary Expectation (Annual USD)</Label>
                      <Input
                        id="salaryExpectation"
                        type="number"
                        value={salaryExpectation}
                        onChange={(e) => setSalaryExpectation(e.target.value)}
                        placeholder="e.g., 120000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="noticePeriod">Notice Period</Label>
                      <select
                        id="noticePeriod"
                        value={noticePeriod}
                        onChange={(e) => setNoticePeriod(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select...</option>
                        <option value="immediate">Immediate</option>
                        <option value="2-weeks">2 Weeks</option>
                        <option value="1-month">1 Month</option>
                        <option value="2-months">2 Months</option>
                        <option value="3-months">3 Months</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="willingToRelocate"
                        checked={willingToRelocate}
                        onChange={(e) => setWillingToRelocate(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="willingToRelocate" className="font-normal">
                        Willing to relocate
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Skills Summary */}
                {parsedResumeData.skills && parsedResumeData.skills.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Skills Extracted</h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedResumeData.skills.slice(0, 20).map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                      {parsedResumeData.skills.length > 20 && (
                        <Badge variant="outline">+{parsedResumeData.skills.length - 20} more</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience Summary */}
                {parsedResumeData.experience && parsedResumeData.experience.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Experience Extracted</h3>
                    <div className="space-y-2">
                      {parsedResumeData.experience.slice(0, 3).map((exp: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-sm">{exp.title} at {exp.company}</p>
                          {exp.duration && <p className="text-xs text-gray-600">{exp.duration}</p>}
                        </div>
                      ))}
                      {parsedResumeData.experience.length > 3 && (
                        <p className="text-sm text-gray-600">+{parsedResumeData.experience.length - 3} more positions</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Education Summary */}
                {parsedResumeData.education && parsedResumeData.education.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">Education Extracted</h3>
                    <div className="space-y-2">
                      {parsedResumeData.education.map((edu: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-sm">{edu.degree}</p>
                          <p className="text-sm text-gray-600">{edu.institution}</p>
                          {edu.year && <p className="text-xs text-gray-600">{edu.year}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResumeReviewModal(false);
                      setParsedResumeData(null);
                      setResumeUrl('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmResume}
                    disabled={saveResumeAfterReviewMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saveResumeAfterReviewMutation.isPending ? 'Saving...' : 'Save Resume Profile'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </CandidateLayout>
  );
}
