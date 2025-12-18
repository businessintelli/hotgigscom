import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, Edit, Save, X, Mail, Phone, MapPin, Linkedin, Github,
  Award, Briefcase, GraduationCap, Target, TrendingUp, Plus, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface ParsedResume {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  summary?: string;
  skills?: string[];
  experience?: Array<{
    title?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    duration?: string;
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    location?: string;
    graduationDate?: string;
    gpa?: string;
    fieldOfStudy?: string;
  }>;
  certifications?: string[];
  languages?: string[];
  projects?: any[];
}

export default function ResumeDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ParsedResume | null>(null);

  // Get candidate profile
  const { data: candidateProfile } = trpc.candidate.getProfile.useQuery(undefined, {
    enabled: !!user,
  });

  // Get all resume profiles
  const { data: resumeProfiles = [], refetch } = trpc.resumeProfile.getResumeProfiles.useQuery(
    { candidateId: candidateProfile?.id || 0 },
    { enabled: !!candidateProfile?.id }
  );

  // Find the specific resume
  const resume = resumeProfiles.find(r => r.id === parseInt(id || '0'));

  // Parse the resume data
  const parsedData: ParsedResume = resume?.parsedData 
    ? JSON.parse(resume.parsedData) 
    : {};

  // Initialize edited data when entering edit mode
  const handleStartEdit = () => {
    setEditedData(parsedData);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedData(null);
    setIsEditing(false);
  };

  // Update mutation
  const updateMutation = trpc.resumeProfile.updateResumeProfileData.useMutation({
    onSuccess: () => {
      toast.success('Resume updated successfully');
      setIsEditing(false);
      setEditedData(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update resume');
    },
  });

  const handleSave = () => {
    if (!resume || !editedData) return;

    updateMutation.mutate({
      id: resume.id,
      parsedData: JSON.stringify(editedData),
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (!resume) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Resume not found</h1>
          <Button onClick={() => setLocation('/candidate/my-resumes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Resumes
          </Button>
        </div>
      </div>
    );
  }

  const data = isEditing ? editedData! : parsedData;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          onClick={() => setLocation('/candidate/my-resumes')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Resumes
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{resume.profileName}</h1>
            <p className="text-muted-foreground mt-1">
              {resume.primaryDomain || 'General'} • {resume.totalExperienceYears || 0} years experience
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button onClick={handleStartEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => window.open(resume.resumeUrl, '_blank')}>
                  View Original
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Scores Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>AI-Powered Resume Scores</CardTitle>
            <CardDescription>
              Automatically calculated based on your skills, experience, and domain expertise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    Overall
                  </span>
                  <span className={`text-2xl font-bold ${getScoreColor(resume.overallScore || 0)}`}>
                    {resume.overallScore || 0}%
                  </span>
                </div>
                <Progress value={resume.overallScore || 0} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    Domain
                  </span>
                  <span className={`text-lg font-bold ${getScoreColor(resume.domainMatchScore || 0)}`}>
                    {resume.domainMatchScore || 0}%
                  </span>
                </div>
                <Progress value={resume.domainMatchScore || 0} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Skills
                  </span>
                  <span className={`text-lg font-bold ${getScoreColor(resume.skillMatchScore || 0)}`}>
                    {resume.skillMatchScore || 0}%
                  </span>
                </div>
                <Progress value={resume.skillMatchScore || 0} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    Experience
                  </span>
                  <span className={`text-lg font-bold ${getScoreColor(resume.experienceScore || 0)}`}>
                    {resume.experienceScore || 0}%
                  </span>
                </div>
                <Progress value={resume.experienceScore || 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={data.personalInfo?.name || ''}
                    onChange={(e) => setEditedData({
                      ...data,
                      personalInfo: { ...data.personalInfo, name: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={data.personalInfo?.email || ''}
                    onChange={(e) => setEditedData({
                      ...data,
                      personalInfo: { ...data.personalInfo, email: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={data.personalInfo?.phone || ''}
                    onChange={(e) => setEditedData({
                      ...data,
                      personalInfo: { ...data.personalInfo, phone: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={data.personalInfo?.location || ''}
                    onChange={(e) => setEditedData({
                      ...data,
                      personalInfo: { ...data.personalInfo, location: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input
                    value={data.personalInfo?.linkedin || ''}
                    onChange={(e) => setEditedData({
                      ...data,
                      personalInfo: { ...data.personalInfo, linkedin: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>GitHub</Label>
                  <Input
                    value={data.personalInfo?.github || ''}
                    onChange={(e) => setEditedData({
                      ...data,
                      personalInfo: { ...data.personalInfo, github: e.target.value }
                    })}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.personalInfo?.name && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Name:</span>
                    <span>{data.personalInfo.name}</span>
                  </div>
                )}
                {data.personalInfo?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{data.personalInfo.email}</span>
                  </div>
                )}
                {data.personalInfo?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{data.personalInfo.phone}</span>
                  </div>
                )}
                {data.personalInfo?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{data.personalInfo.location}</span>
                  </div>
                )}
                {data.personalInfo?.linkedin && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-muted-foreground" />
                    <a href={`https://linkedin.com/in/${data.personalInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {data.personalInfo.linkedin}
                    </a>
                  </div>
                )}
                {data.personalInfo?.github && (
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-muted-foreground" />
                    <a href={`https://github.com/${data.personalInfo.github}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {data.personalInfo.github}
                    </a>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {(data.summary || isEditing) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Professional Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={data.summary || ''}
                  onChange={(e) => setEditedData({ ...data, summary: e.target.value })}
                  rows={4}
                  placeholder="Enter professional summary..."
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">{data.summary}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Label>Skills (comma-separated)</Label>
                <Textarea
                  value={data.skills?.join(', ') || ''}
                  onChange={(e) => setEditedData({
                    ...data,
                    skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  rows={4}
                  placeholder="JavaScript, React, Node.js, Python..."
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.skills?.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experience */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Work Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.experience?.map((exp, index) => (
                <div key={index} className="border-l-2 border-primary pl-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={exp.title || ''}
                            onChange={(e) => {
                              const newExp = [...(data.experience || [])];
                              newExp[index] = { ...newExp[index], title: e.target.value };
                              setEditedData({ ...data, experience: newExp });
                            }}
                          />
                        </div>
                        <div>
                          <Label>Company</Label>
                          <Input
                            value={exp.company || ''}
                            onChange={(e) => {
                              const newExp = [...(data.experience || [])];
                              newExp[index] = { ...newExp[index], company: e.target.value };
                              setEditedData({ ...data, experience: newExp });
                            }}
                          />
                        </div>
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            value={exp.startDate || ''}
                            onChange={(e) => {
                              const newExp = [...(data.experience || [])];
                              newExp[index] = { ...newExp[index], startDate: e.target.value };
                              setEditedData({ ...data, experience: newExp });
                            }}
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            value={exp.endDate || ''}
                            onChange={(e) => {
                              const newExp = [...(data.experience || [])];
                              newExp[index] = { ...newExp[index], endDate: e.target.value };
                              setEditedData({ ...data, experience: newExp });
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={exp.description || ''}
                          onChange={(e) => {
                            const newExp = [...(data.experience || [])];
                            newExp[index] = { ...newExp[index], description: e.target.value };
                            setEditedData({ ...data, experience: newExp });
                          }}
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-lg">{exp.title}</h3>
                      <p className="text-muted-foreground">{exp.company}</p>
                      <p className="text-sm text-muted-foreground">
                        {exp.startDate} - {exp.endDate} {exp.duration && `(${exp.duration})`}
                      </p>
                      {exp.location && (
                        <p className="text-sm text-muted-foreground">{exp.location}</p>
                      )}
                      {exp.description && (
                        <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{exp.description}</p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        {(data.education && data.education.length > 0) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.education.map((edu, index) => (
                  <div key={index}>
                    <h3 className="font-semibold">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</h3>
                    <p className="text-muted-foreground">{edu.institution}</p>
                    <p className="text-sm text-muted-foreground">
                      {edu.graduationDate} {edu.gpa && `• GPA: ${edu.gpa}`}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        {(data.certifications && data.certifications.length > 0) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline">
                    <Award className="w-3 h-3 mr-1" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
