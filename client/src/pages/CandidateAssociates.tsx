import { useAuth } from "@/_core/hooks/useAuth";
import { EmailVerificationGuard } from "@/components/EmailVerificationGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  ArrowLeft, 
  Building2, 
  Calendar, 
  MapPin,
  Briefcase,
  CheckCircle,
  Clock,
  Loader2,
  UserCheck,
  PartyPopper
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function CandidateAssociates() {
  return (
    <EmailVerificationGuard>
      <CandidateAssociatesContent />
    </EmailVerificationGuard>
  );
}

function CandidateAssociatesContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch candidate profile
  const { data: candidate } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Fetch placed applications (hired status)
  const { data: placedApplications, isLoading } = trpc.application.getPlacedByCandidate.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/candidate-dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              My Associates
            </h1>
            <p className="text-gray-500">Your placement history and current positions</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {placedApplications?.filter(a => a.status === 'offered').length || 0}
                  </p>
                  <p className="text-green-600 text-sm">Successful Placements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {new Set(placedApplications?.map(a => a.job?.companyName)).size || 0}
                  </p>
                  <p className="text-blue-600 text-sm">Companies Worked With</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">
                    {placedApplications?.filter(a => a.status === 'offered').length || 0}
                  </p>
                  <p className="text-purple-600 text-sm">Pending Offers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Placements List */}
        {placedApplications && placedApplications.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Placement History</h2>
            
            {placedApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 bg-gradient-to-br from-blue-500 to-purple-500">
                      <AvatarFallback className="text-white text-lg">
                        {application.job?.companyName?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{application.job?.title}</h3>
                          <p className="text-gray-600 flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {application.job?.companyName || 'Company'}
                          </p>
                        </div>
                        <Badge 
                          className={
                            application.status === 'offered'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }
                        >
                          {application.status === 'offered' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Offer Accepted
                            </>
                          ) : (
                            application.status
                          )}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                        {application.job?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {application.job.location}
                          </span>
                        )}
                        {application.job?.employmentType && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {application.job.employmentType}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Applied: {format(new Date(application.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>

                      {application.status === 'offered' && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-green-700 text-sm flex items-center gap-2">
                            <PartyPopper className="h-4 w-4" />
                            Congratulations! You have received an offer for this position.
                          </p>
                        </div>
                      )}


                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Placements Yet</h3>
              <p className="text-gray-500 mb-4">
                Once you receive an offer and get hired, your placements will appear here.
              </p>
              <Button onClick={() => setLocation("/jobs")}>
                <Briefcase className="h-4 w-4 mr-2" />
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
