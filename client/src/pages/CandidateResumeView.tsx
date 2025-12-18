import { useState, useMemo } from 'react';
import { useParams, useLocation, useSearch } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Mail, Phone, MapPin, Linkedin, Github,
  Award, Briefcase, GraduationCap, Target, TrendingUp, Video, Play
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

export default function CandidateResumeView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const videoId = searchParams.get('videoId');
  const { user } = useAuth();
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  // Get resume profile by ID (accessible by recruiters)
  const { data: resume, isLoading } = trpc.resumeProfile.getResumeProfileById.useQuery(
    { id: parseInt(id || '0') },
    { enabled: !!id }
  );

  // Get video introduction if videoId is provided
  const { data: videoIntro } = trpc.resumeProfile.getVideoIntroductionById.useQuery(
    { id: parseInt(videoId || '0') },
    { enabled: !!videoId && videoId !== '0' }
  );

  // Parse the resume data
  const parsedData: ParsedResume = resume?.parsedData 
    ? JSON.parse(resume.parsedData) 
    : {};

  // Parse top domains and skills
  const topDomains = useMemo(() => {
    if (!resume?.topDomains || typeof resume.topDomains !== 'string') return [];
    try {
      return JSON.parse(resume.topDomains);
    } catch {
      return [];
    }
  }, [resume?.topDomains]);

  const topSkills = useMemo(() => {
    if (!resume?.topSkills || typeof resume.topSkills !== 'string') return [];
    try {
      return JSON.parse(resume.topSkills);
    } catch {
      return [];
    }
  }, [resume?.topSkills]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p>Loading resume...</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Resume not found</h1>
          <Button onClick={() => setLocation('/recruiter/applications')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
        </div>
      </div>
    );
  }

  const data = parsedData;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          onClick={() => setLocation('/recruiter/applications')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Applications
        </Button>

        {/* Video Introduction Section */}
        {videoIntro && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-purple-600" />
                    Video Introduction
                  </CardTitle>
                  <CardDescription>
                    {Math.floor(videoIntro.duration / 60)} min {videoIntro.duration % 60} sec
                  </CardDescription>
                </div>
                <Button onClick={() => setVideoDialogOpen(true)}>
                  <Play className="w-4 h-4 mr-2" />
                  Watch Video
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{resume.profileName}</h1>
            <p className="text-muted-foreground mt-1">
              {resume.primaryDomain || 'General'} • {resume.totalExperienceYears || 0} years experience
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.open(resume.resumeUrl, '_blank')}>
              View Original Resume
            </Button>
          </div>
        </div>

        {/* Scores Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>AI-Powered Resume Scores</CardTitle>
            <CardDescription>
              Automatically calculated based on skills, experience, and domain expertise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

            {/* Top Domains and Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              {topDomains.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Top 5 Domains</h4>
                  <div className="space-y-2">
                    {topDomains.slice(0, 5).map((domain: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{domain.name}</span>
                        <Badge variant="secondary">{domain.percentage}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {topSkills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Top 5 Skills</h4>
                  <div className="space-y-2">
                    {topSkills.slice(0, 5).map((skill: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{skill.name}</span>
                        <Badge variant="secondary">{skill.percentage}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.personalInfo?.name && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Name:</span>
                  <span>{data.personalInfo.name}</span>
                </div>
              )}
              {data.personalInfo?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href={`mailto:${data.personalInfo.email}`} className="text-blue-600 hover:underline">
                    {data.personalInfo.email}
                  </a>
                </div>
              )}
              {data.personalInfo?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${data.personalInfo.phone}`} className="text-blue-600 hover:underline">
                    {data.personalInfo.phone}
                  </a>
                </div>
              )}
              {data.personalInfo?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{data.personalInfo.location}</span>
                </div>
              )}
              {data.personalInfo?.linkedin && (
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-gray-500" />
                  <a href={data.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    LinkedIn Profile
                  </a>
                </div>
              )}
              {data.personalInfo?.github && (
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-gray-500" />
                  <a href={data.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    GitHub Profile
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Professional Summary */}
        {data.summary && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Professional Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{data.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.experience.map((exp, index) => (
                  <div key={index} className="border-l-2 border-blue-500 pl-4">
                    <h3 className="font-semibold text-lg">{exp.title}</h3>
                    <p className="text-gray-600">
                      {exp.company} {exp.location && `• ${exp.location}`}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      {exp.startDate} - {exp.endDate} {exp.duration && `(${exp.duration})`}
                    </p>
                    {exp.description && (
                      <p className="text-gray-700 whitespace-pre-wrap">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
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
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <p className="text-gray-600">{edu.institution}</p>
                    {edu.fieldOfStudy && <p className="text-sm text-gray-500">{edu.fieldOfStudy}</p>}
                    <p className="text-sm text-gray-500">
                      {edu.graduationDate} {edu.gpa && `• GPA: ${edu.gpa}`}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {data.certifications.map((cert, index) => (
                  <li key={index}>{cert}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.languages.map((lang, index) => (
                  <Badge key={index} variant="outline">
                    {lang}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Video Dialog */}
      {videoIntro && (
        <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Video Introduction</DialogTitle>
            </DialogHeader>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video 
                src={videoIntro.videoUrl} 
                controls 
                className="w-full h-full"
                autoPlay
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
