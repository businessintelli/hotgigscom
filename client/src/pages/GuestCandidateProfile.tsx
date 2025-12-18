import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Github, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Languages, 
  FolderGit,
  Calendar,
  Building,
  FileText,
  Send,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

export default function GuestCandidateProfile() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const guestAppId = parseInt(params.id || "0");

  const { data: guestProfile, isLoading } = trpc.guestApplication.getFullProfile.useQuery(
    { id: guestAppId },
    { enabled: guestAppId > 0 }
  );

  const utils = trpc.useContext();
  const inviteMutation = trpc.guestApplication.sendInvitation.useMutation({
    onSuccess: () => {
      utils.guestApplication.getFullProfile.invalidate({ id: guestAppId });
      toast.success("Invitation sent successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to send invitation: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!guestProfile) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">Guest application not found</p>
            <Button onClick={() => setLocation("/recruiter/applications")} className="mt-4">
              Back to Applications
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const parsedResume = guestProfile.parsedResume;

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/recruiter/applications")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{guestProfile.name}</h1>
            <p className="text-sm text-gray-500">Guest Applicant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={guestProfile.claimed ? "default" : "secondary"}>
            {guestProfile.claimed ? "Registered" : "Guest"}
          </Badge>
          {!guestProfile.claimed && (
            <Button
              onClick={() => inviteMutation.mutate({ guestApplicationId: guestAppId })}
              disabled={inviteMutation.isPending || guestProfile.invitationSent}
            >
              <Send className="h-4 w-4 mr-2" />
              {guestProfile.invitationSent ? "Invitation Sent" : "Invite to Register"}
            </Button>
          )}
        </div>
      </div>

      {/* Application Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Application Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Applied For</p>
              <p className="text-base font-semibold">{guestProfile.job?.title || "Unknown Position"}</p>
              {guestProfile.job?.companyName && (
                <p className="text-sm text-gray-600">{guestProfile.job.companyName}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Submitted</p>
              <p className="text-base">{new Date(guestProfile.submittedAt).toLocaleDateString()}</p>
            </div>
          </div>
          {guestProfile.coverLetter && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Cover Letter</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{guestProfile.coverLetter}</p>
              </div>
            </div>
          )}
          {guestProfile.invitationSent && guestProfile.invitedAt && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Invitation sent on {new Date(guestProfile.invitedAt).toLocaleDateString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base">{guestProfile.email}</p>
              </div>
            </div>
            {guestProfile.phoneNumber && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-base">{guestProfile.phoneNumber}</p>
                </div>
              </div>
            )}
            {parsedResume?.personalInfo?.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-base">{parsedResume.personalInfo.location}</p>
                </div>
              </div>
            )}
            {parsedResume?.personalInfo?.linkedin && (
              <div className="flex items-center gap-3">
                <Linkedin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">LinkedIn</p>
                  <a 
                    href={`https://linkedin.com/in/${parsedResume.personalInfo.linkedin}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-base text-blue-600 hover:underline"
                  >
                    {parsedResume.personalInfo.linkedin}
                  </a>
                </div>
              </div>
            )}
            {parsedResume?.personalInfo?.github && (
              <div className="flex items-center gap-3">
                <Github className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">GitHub</p>
                  <a 
                    href={`https://github.com/${parsedResume.personalInfo.github}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-base text-blue-600 hover:underline"
                  >
                    {parsedResume.personalInfo.github}
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional Summary */}
      {parsedResume?.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Professional Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{parsedResume.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Experience Statistics */}
      {parsedResume?.metadata && (
        <Card>
          <CardHeader>
            <CardTitle>Career Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Total Experience</p>
                <p className="text-2xl font-bold text-blue-600">
                  {parsedResume.metadata.totalExperienceYears || 0} years
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Seniority Level</p>
                <p className="text-2xl font-bold text-green-600 capitalize">
                  {parsedResume.metadata.seniorityLevel || "Entry"}
                </p>
              </div>
              {parsedResume.metadata.primaryDomain && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Primary Domain</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {parsedResume.metadata.primaryDomain}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Experience */}
      {parsedResume?.experience && parsedResume.experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Experience
            </CardTitle>
            <CardDescription>
              {parsedResume.experience.length} position{parsedResume.experience.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {parsedResume.experience.map((exp: any, idx: number) => (
              <div key={idx} className="border-l-2 border-blue-500 pl-4">
                <h3 className="font-semibold text-lg">{exp.title || "Position"}</h3>
                <p className="text-gray-600 font-medium">{exp.company || "Company"}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {exp.startDate || ""} - {exp.endDate || "Present"}
                  </span>
                  {exp.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {exp.location}
                    </span>
                  )}
                </div>
                {exp.description && (
                  <p className="text-gray-700 mt-3 text-sm whitespace-pre-wrap">{exp.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {parsedResume?.education && parsedResume.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedResume.education.map((edu: any, idx: number) => (
              <div key={idx}>
                <h3 className="font-semibold text-lg">
                  {edu.degree || "Degree"} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                </h3>
                <p className="text-gray-600 font-medium">{edu.institution || "Institution"}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  {edu.graduationDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {edu.graduationDate}
                    </span>
                  )}
                  {edu.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {edu.location}
                    </span>
                  )}
                  {edu.gpa && (
                    <span>GPA: {edu.gpa}</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {parsedResume?.skills && parsedResume.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>{parsedResume.skills.length} skills identified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {parsedResume.skills.map((skill: string, idx: number) => (
                <Badge key={idx} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {parsedResume?.certifications && parsedResume.certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              {parsedResume.certifications.map((cert: string, idx: number) => (
                <li key={idx} className="text-gray-700">{cert}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Languages */}
      {parsedResume?.languages && parsedResume.languages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {parsedResume.languages.map((lang: string, idx: number) => (
                <Badge key={idx} variant="outline">
                  {lang}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      {parsedResume?.projects && parsedResume.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderGit className="h-5 w-5" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedResume.projects.map((project: any, idx: number) => (
              <div key={idx}>
                <h3 className="font-semibold text-lg">{project.name || "Project"}</h3>
                {project.description && (
                  <p className="text-gray-700 mt-2 text-sm">{project.description}</p>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.technologies.map((tech: string, techIdx: number) => (
                      <Badge key={techIdx} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
                {project.url && (
                  <a 
                    href={project.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  >
                    View Project →
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Resume Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Original Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => window.open(guestProfile.resumeUrl, "_blank")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download {guestProfile.resumeFilename}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
