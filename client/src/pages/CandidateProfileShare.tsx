import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  FileText,
  Video,
  Star,
  Calendar,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Clock,
  AlertCircle
} from "lucide-react";
import { useParams } from "wouter";
import { format } from "date-fns";

export default function CandidateProfileShare() {
  const params = useParams<{ shareToken: string }>();
  const shareToken = params.shareToken;

  // Fetch shared profile data
  const { data: sharedProfile, isLoading, error } = trpc.candidate.getSharedProfile.useQuery(
    { shareToken: shareToken || '' },
    { enabled: !!shareToken }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (error || !sharedProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Profile Not Available</h2>
            <p className="text-gray-600 mb-4">
              This shared profile link may have expired or is no longer valid.
            </p>
            <p className="text-sm text-gray-500">
              Please contact the recruiter for an updated link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { candidate, user, resumeProfile, videoIntroduction, sharedBy, expiresAt } = sharedProfile;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm">Secure Candidate Profile</span>
          </div>
          {expiresAt && (
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Clock className="h-4 w-4" />
              <span>Expires: {format(new Date(expiresAt), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-500">
                <AvatarFallback className="text-white text-3xl">
                  {user?.name?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{user?.name || 'Candidate'}</h1>
                <p className="text-lg text-gray-600">{candidate?.title || 'Professional'}</p>
                
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                  {candidate?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {candidate.location}
                    </span>
                  )}
                  {candidate?.experienceYears && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {candidate.experienceYears} years experience
                    </span>
                  )}
                </div>

                {/* Skills */}
                {candidate?.skills && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {candidate.skills.split(',').slice(0, 8).map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {skill.trim()}
                      </Badge>
                    ))}
                    {candidate.skills.split(',').length > 8 && (
                      <Badge variant="outline">+{candidate.skills.split(',').length - 8} more</Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Match Score if available */}
              {sharedProfile.matchScore && (
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600">
                    {sharedProfile.matchScore}%
                  </div>
                  <p className="text-sm text-green-700">Match Score</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="video">Video Intro</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Professional Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate?.bio ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{candidate.bio}</p>
                ) : (
                  <p className="text-gray-500 italic">No summary provided</p>
                )}

                {/* Education */}
                {candidate?.education && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      Education
                    </h3>
                    <p className="text-gray-700">{candidate.education}</p>
                  </div>
                )}

                {/* Availability */}
                {candidate?.availability && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      Availability
                    </h3>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {candidate.availability}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience">
            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
              </CardHeader>
              <CardContent>
                {resumeProfile?.parsedData ? (
                  <div className="space-y-4">
                    {(() => {
                      try {
                        const parsed = JSON.parse(resumeProfile.parsedData);
                        const experience = parsed.workExperience || parsed.experience || [];
                        return experience.map((exp: any, index: number) => (
                          <div key={index} className="border-l-2 border-blue-200 pl-4 py-2">
                            <h4 className="font-semibold">{exp.title || exp.position}</h4>
                            <p className="text-gray-600">{exp.company || exp.organization}</p>
                            <p className="text-sm text-gray-500">{exp.duration || `${exp.startDate || ''} - ${exp.endDate || 'Present'}`}</p>
                            {exp.description && (
                              <p className="text-gray-700 mt-2">{exp.description}</p>
                            )}
                          </div>
                        ));
                      } catch {
                        return <p className="text-gray-500 italic">Unable to parse experience data</p>;
                      }
                    })()}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No work experience details available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resume">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resumeProfile?.resumeUrl ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium">{resumeProfile.resumeFilename || 'Resume'}</p>
                            <p className="text-sm text-gray-500">
                              Uploaded {format(new Date(resumeProfile.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <Button asChild>
                          <a href={resumeProfile.resumeUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Resume
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* AI-Extracted Skills */}
                    {resumeProfile?.parsedData && (
                      <div>
                        <h4 className="font-medium mb-2">Extracted Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            try {
                              const parsed = JSON.parse(resumeProfile.parsedData);
                              const skills = parsed.skills || [];
                              return skills.map((skill: string, index: number) => (
                                <Badge key={index} variant="secondary">{skill}</Badge>
                              ));
                            } catch {
                              return null;
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : candidate?.resumeUrl ? (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">Resume</p>
                        </div>
                      </div>
                      <Button asChild>
                        <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Resume
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No resume available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Introduction
                </CardTitle>
              </CardHeader>
              <CardContent>
                {videoIntroduction?.videoUrl ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        src={videoIntroduction.videoUrl}
                        controls
                        className="w-full h-full"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Duration: {Math.floor((videoIntroduction.duration || 0) / 60)}:{((videoIntroduction.duration || 0) % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No video introduction available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Shared By Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{sharedBy?.name?.charAt(0) || 'R'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-blue-600">Shared by</p>
                  <p className="font-medium">{sharedBy?.name || 'Recruiter'}</p>
                </div>
              </div>
              <p className="text-sm text-blue-600">
                via HotGigs Recruitment Platform
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
