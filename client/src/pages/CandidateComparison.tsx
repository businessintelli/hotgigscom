import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Mail, Phone, MapPin, Linkedin, Github, Award, Briefcase, GraduationCap, Star } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function CandidateComparison() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const candidateIds = searchParams.get('ids')?.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) || [];

  // Fetch applications for comparison
  const { data: applications = [], isLoading } = trpc.application.list.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  // Filter to only selected candidates
  const selectedApplications = applications.filter((app: any) => 
    candidateIds.includes(app.id)
  ).slice(0, 5); // Max 5 candidates

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedApplications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="container mx-auto">
          <Button variant="ghost" onClick={() => setLocation('/recruiter/applications')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
          <div className="text-center py-12">
            <p className="text-gray-600">No candidates selected for comparison</p>
            <Button className="mt-4" onClick={() => setLocation('/recruiter/applications')}>
              Go to Applications
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation('/recruiter/applications')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
          <h1 className="text-3xl font-bold mt-4">Candidate Comparison</h1>
          <p className="text-gray-600">Compare up to 5 candidates side-by-side</p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                        Criteria
                      </th>
                      {selectedApplications.map((app: any) => (
                        <th key={app.id} className="px-4 py-3 text-left text-sm font-semibold text-gray-900 min-w-[250px]">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold">{app.candidate?.fullName || 'Unknown'}</span>
                            <span className="text-xs text-gray-600 font-normal">{app.job?.title || 'N/A'}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Contact Information */}
                    <tr className="bg-white">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </td>
                      {selectedApplications.map((app: any) => (
                        <td key={app.id} className="px-4 py-3 text-sm text-gray-700">
                          {app.candidate?.email || 'N/A'}
                        </td>
                      ))}
                    </tr>

                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone
                      </td>
                      {selectedApplications.map((app: any) => (
                        <td key={app.id} className="px-4 py-3 text-sm text-gray-700">
                          {app.candidate?.phoneNumber || 'N/A'}
                        </td>
                      ))}
                    </tr>

                    <tr className="bg-white">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        Location
                      </td>
                      {selectedApplications.map((app: any) => (
                        <td key={app.id} className="px-4 py-3 text-sm text-gray-700">
                          {app.candidate?.location || 'N/A'}
                        </td>
                      ))}
                    </tr>

                    {/* AI Scores */}
                    <tr className="bg-blue-50">
                      <td colSpan={selectedApplications.length + 1} className="px-4 py-2 text-sm font-bold text-gray-900">
                        AI-Powered Scores
                      </td>
                    </tr>

                    <tr className="bg-white">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        <Star className="w-4 h-4 inline mr-2 text-yellow-500" />
                        Overall Score
                      </td>
                      {selectedApplications.map((app: any) => (
                        <td key={app.id} className="px-4 py-3">
                          {app.resumeProfile ? (
                            <div className="space-y-1">
                              <div className={`text-2xl font-bold ${getScoreColor(app.resumeProfile.overallScore || 0)}`}>
                                {app.resumeProfile.overallScore || 0}%
                              </div>
                              <Progress value={app.resumeProfile.overallScore || 0} className="h-2" />
                            </div>
                          ) : (
                            <span className="text-gray-400">No resume profile</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10">
                        Domain Match
                      </td>
                      {selectedApplications.map((app: any) => (
                        <td key={app.id} className="px-4 py-3">
                          {app.resumeProfile ? (
                            <div className="space-y-1">
                              <div className={`text-lg font-semibold ${getScoreColor(app.resumeProfile.domainMatchScore || 0)}`}>
                                {app.resumeProfile.domainMatchScore || 0}%
                              </div>
                              <Progress value={app.resumeProfile.domainMatchScore || 0} className="h-2" />
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    <tr className="bg-white">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        Skill Match
                      </td>
                      {selectedApplications.map((app: any) => (
                        <td key={app.id} className="px-4 py-3">
                          {app.resumeProfile ? (
                            <div className="space-y-1">
                              <div className={`text-lg font-semibold ${getScoreColor(app.resumeProfile.skillMatchScore || 0)}`}>
                                {app.resumeProfile.skillMatchScore || 0}%
                              </div>
                              <Progress value={app.resumeProfile.skillMatchScore || 0} className="h-2" />
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10">
                        Experience Score
                      </td>
                      {selectedApplications.map((app: any) => (
                        <td key={app.id} className="px-4 py-3">
                          {app.resumeProfile ? (
                            <div className="space-y-1">
                              <div className={`text-lg font-semibold ${getScoreColor(app.resumeProfile.experienceScore || 0)}`}>
                                {app.resumeProfile.experienceScore || 0}%
                              </div>
                              <Progress value={app.resumeProfile.experienceScore || 0} className="h-2" />
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Top Skills */}
                    <tr className="bg-purple-50">
                      <td colSpan={selectedApplications.length + 1} className="px-4 py-2 text-sm font-bold text-gray-900">
                        Top Skills
                      </td>
                    </tr>

                    <tr className="bg-white">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        Skills
                      </td>
                      {selectedApplications.map((app: any) => (
                        <td key={app.id} className="px-4 py-3">
                          {app.resumeProfile?.topSkills ? (
                            <div className="flex flex-wrap gap-1">
                              {JSON.parse(app.resumeProfile.topSkills).slice(0, 5).map((skill: any, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill.name} ({skill.percentage}%)
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Top Domains */}
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10">
                        Domains
                      </td>
                      {selectedApplications.map((app: any) => (
                        <td key={app.id} className="px-4 py-3">
                          {app.resumeProfile?.topDomains ? (
                            <div className="flex flex-wrap gap-1">
                              {JSON.parse(app.resumeProfile.topDomains).slice(0, 3).map((domain: any, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {domain.name} ({domain.percentage}%)
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Experience */}
                    <tr className="bg-green-50">
                      <td colSpan={selectedApplications.length + 1} className="px-4 py-2 text-sm font-bold text-gray-900">
                        Experience & Education
                      </td>
                    </tr>

                    <tr className="bg-white">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        <Briefcase className="w-4 h-4 inline mr-2" />
                        Total Experience
                      </td>
                      {selectedApplications.map((app: any) => (
                        <td key={app.id} className="px-4 py-3 text-sm text-gray-700">
                          {app.resumeProfile?.totalExperienceYears 
                            ? `${app.resumeProfile.totalExperienceYears} years`
                            : 'N/A'}
                        </td>
                      ))}
                    </tr>

                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10">
                        Primary Domain
                      </td>
                      {selectedApplications.map((app: any) => (
                        <td key={app.id} className="px-4 py-3">
                          {app.resumeProfile?.primaryDomain ? (
                            <Badge>{app.resumeProfile.primaryDomain}</Badge>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Actions */}
                    <tr className="bg-white">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        Actions
                      </td>
                      {selectedApplications.map((app: any) => (
                        <td key={app.id} className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            {app.resumeProfileId && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const videoParam = app.videoIntroductionId ? `?videoId=${app.videoIntroductionId}` : '';
                                  setLocation(`/recruiter/candidate-resume/${app.resumeProfileId}${videoParam}`);
                                }}
                              >
                                View Full Resume
                              </Button>
                            )}
                            <Button 
                              size="sm"
                              onClick={() => setLocation(`/recruiter/applications?highlight=${app.id}`)}
                            >
                              View Application
                            </Button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
