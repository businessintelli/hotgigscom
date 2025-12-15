import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, Upload, Star, Trash2, Download, Plus, CheckCircle2, ArrowLeft,
  LayoutGrid, LayoutList, TrendingUp, Award, Briefcase, Target
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

type ViewMode = 'list' | 'grid';

export default function MyResumesNew() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Get candidate profile
  const { data: candidateProfile } = trpc.candidate.getProfile.useQuery(undefined, {
    enabled: !!user,
  });

  // Get resume profiles with ranking
  const { data: resumeProfiles = [], refetch: refetchProfiles } = trpc.resumeProfile.getResumeProfiles.useQuery(
    { candidateId: candidateProfile?.id || 0 },
    { enabled: !!candidateProfile?.id }
  );

  const utils = trpc.useUtils();

  // Mutations
  const createProfileMutation = trpc.resumeProfile.createResumeProfile.useMutation({
    onSuccess: () => {
      toast.success('Resume uploaded and parsed successfully!');
      setUploadDialogOpen(false);
      setProfileName('');
      setSelectedFile(null);
      refetchProfiles();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload resume');
    },
  });

  const setDefaultMutation = trpc.resumeProfile.setDefaultResumeProfile.useMutation({
    onSuccess: () => {
      toast.success('Default resume updated');
      refetchProfiles();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to set default resume');
    },
  });

  const deleteProfileMutation = trpc.resumeProfile.deleteResumeProfile.useMutation({
    onSuccess: () => {
      toast.success('Resume deleted');
      refetchProfiles();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete resume');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF or DOCX file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !candidateProfile || !profileName.trim()) {
      toast.error('Please provide a profile name and select a file');
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target?.result as string;

        try {
          await createProfileMutation.mutateAsync({
            candidateId: candidateProfile.id,
            profileName: profileName.trim(),
            fileData,
            fileName: selectedFile.name,
          });
        } catch (error: any) {
          toast.error(error.message || 'Upload failed');
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read file');
        setIsUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
      setIsUploading(false);
    }
  };

  const handleSetDefault = (profileId: number) => {
    if (!candidateProfile) return;
    setDefaultMutation.mutate({ candidateId: candidateProfile.id, profileId });
  };

  const handleDelete = (profileId: number) => {
    if (confirm('Are you sure you want to delete this resume?')) {
      deleteProfileMutation.mutate({ id: profileId });
    }
  };

  const handleViewDetails = (profileId: number) => {
    setLocation(`/candidate/resume/${profileId}`);
  };

  const canAddMore = resumeProfiles.length < 5;

  // Sort resumes by overall score (highest first)
  const sortedResumes = [...resumeProfiles].sort((a, b) => 
    (b.overallScore || 0) - (a.overallScore || 0)
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'outline';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <Button 
          onClick={() => setLocation('/candidate-dashboard')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Resumes</h1>
            <p className="text-muted-foreground mt-2">
              Manage up to 5 resume profiles with AI-powered ranking and insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            {/* Upload Button */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canAddMore}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Resume
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New Resume</DialogTitle>
                  <DialogDescription>
                    Upload a resume and we'll automatically parse it with AI to extract skills, experience, and more.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="profileName">Profile Name</Label>
                    <Input
                      id="profileName"
                      placeholder="e.g., Software Engineer, Data Scientist"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="file">Resume File (PDF or DOCX)</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileSelect}
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={handleUpload} 
                    disabled={isUploading || !selectedFile || !profileName.trim()}
                    className="w-full"
                  >
                    {isUploading ? 'Uploading & Parsing...' : 'Upload with AI Parsing'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Empty State */}
        {sortedResumes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No resumes uploaded yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first resume to get started with AI-powered insights
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {sortedResumes.map((profile, index) => (
                  <Card 
                    key={profile.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleViewDetails(profile.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">{profile.profileName}</CardTitle>
                            {profile.isDefault && (
                              <Badge variant="default">
                                <Star className="w-3 h-3 mr-1" />
                                Default
                              </Badge>
                            )}
                            <Badge variant={getScoreBadgeVariant(profile.overallScore || 0)}>
                              #{index + 1} Ranked
                            </Badge>
                          </div>
                          <CardDescription>
                            {profile.primaryDomain || 'General'} • {profile.totalExperienceYears || 0} years experience
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {!profile.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefault(profile.id)}
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(profile.resumeUrl, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(profile.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Overall Score */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              Overall
                            </span>
                            <span className={`text-lg font-bold ${getScoreColor(profile.overallScore || 0)}`}>
                              {profile.overallScore || 0}%
                            </span>
                          </div>
                          <Progress value={profile.overallScore || 0} className="h-2" />
                        </div>

                        {/* Domain Match */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              Domain
                            </span>
                            <span className={`text-lg font-bold ${getScoreColor(profile.domainMatchScore || 0)}`}>
                              {profile.domainMatchScore || 0}%
                            </span>
                          </div>
                          <Progress value={profile.domainMatchScore || 0} className="h-2" />
                        </div>

                        {/* Skills */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              Skills
                            </span>
                            <span className={`text-lg font-bold ${getScoreColor(profile.skillMatchScore || 0)}`}>
                              {profile.skillMatchScore || 0}%
                            </span>
                          </div>
                          <Progress value={profile.skillMatchScore || 0} className="h-2" />
                        </div>

                        {/* Experience */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              Experience
                            </span>
                            <span className={`text-lg font-bold ${getScoreColor(profile.experienceScore || 0)}`}>
                              {profile.experienceScore || 0}%
                            </span>
                          </div>
                          <Progress value={profile.experienceScore || 0} className="h-2" />
                        </div>
                      </div>

                      {/* Top Domains & Skills */}
                      <div className="mt-6 pt-6 border-t space-y-4">
                        {/* Top Domains */}
                        {(() => {
                          if (!profile.topDomains || typeof profile.topDomains !== 'string') return null;
                          try {
                            const domains = JSON.parse(profile.topDomains) as Array<{domain: string, percentage: number}>;
                            if (domains.length === 0) return null;
                            return (
                              <div key="domains-list">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                  <Target className="w-4 h-4" />
                                  Top Domains
                                </h4>
                                <div className="space-y-2">
                                  {domains.map((item) => (
                                    <div key={item.domain} className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">{item.percentage}%</Badge>
                                      <span className="text-sm text-muted-foreground">{item.domain}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          } catch { return null; }
                        })()}

                        {/* Top Skills */}
                        {(() => {
                          if (!profile.topSkills || typeof profile.topSkills !== 'string') return null;
                          try {
                            const skills = JSON.parse(profile.topSkills) as Array<{skill: string, percentage: number}>;
                            if (skills.length === 0) return null;
                            return (
                              <div key="skills-list">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Top Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {skills.map((item) => (
                                    <Badge key={item.skill} variant="secondary" className="text-xs">
                                      {item.skill} ({item.percentage}%)
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            );
                          } catch { return null; }
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedResumes.map((profile, index) => (
                  <Card 
                    key={profile.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleViewDetails(profile.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={getScoreBadgeVariant(profile.overallScore || 0)}>
                          #{index + 1}
                        </Badge>
                        {profile.isDefault && (
                          <Badge variant="default">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{profile.profileName}</CardTitle>
                      <CardDescription className="text-xs">
                        {profile.primaryDomain || 'General'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Overall Score - Large Display */}
                      <div className="text-center mb-4">
                        <div className={`text-4xl font-bold ${getScoreColor(profile.overallScore || 0)}`}>
                          {profile.overallScore || 0}%
                        </div>
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                      </div>

                      {/* Individual Scores */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Domain Match</span>
                            <span className="font-medium">{profile.domainMatchScore || 0}%</span>
                          </div>
                          <Progress value={profile.domainMatchScore || 0} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Skills</span>
                            <span className="font-medium">{profile.skillMatchScore || 0}%</span>
                          </div>
                          <Progress value={profile.skillMatchScore || 0} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Experience</span>
                            <span className="font-medium">{profile.experienceScore || 0}%</span>
                          </div>
                          <Progress value={profile.experienceScore || 0} className="h-1.5" />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                        {!profile.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleSetDefault(profile.id)}
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(profile.resumeUrl, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(profile.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Slots Indicator */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {resumeProfiles.length} of 5 resume slots used
            </div>
          </>
        )}
      </div>
    </div>
  );
}
