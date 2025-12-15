import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Calendar, Clock, MapPin, Video, User, Briefcase } from "lucide-react";

export default function PanelAccept() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "expired" | "used" | "success" | "error">("loading");

  const { data: tokenData, isLoading } = (trpc as any).panelPublic.validateToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const acceptMutation = (trpc as any).panelPublic.acceptInvitation.useMutation({
    onSuccess: (result: any) => {
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    },
    onError: () => {
      setStatus("error");
    },
  });

  useEffect(() => {
    if (!isLoading && tokenData) {
      if (tokenData.valid) {
        setStatus("valid");
      } else if (tokenData.expired) {
        setStatus("expired");
      } else if (tokenData.used) {
        setStatus("used");
      } else {
        setStatus("invalid");
      }
    }
  }, [tokenData, isLoading]);

  const handleAccept = () => {
    if (token) {
      acceptMutation.mutate({ token });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Validating your invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "invalid" || status === "expired" || status === "used") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {status === "expired" ? "Link Expired" : status === "used" ? "Already Responded" : "Invalid Link"}
            </h2>
            <p className="text-gray-600">
              {status === "expired"
                ? "This invitation link has expired. Please contact the recruiter for a new invitation."
                : status === "used"
                ? "You have already responded to this invitation."
                : "This invitation link is invalid. Please check your email for the correct link."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for accepting the interview panel invitation. You will receive a calendar invite and reminder before the interview.
            </p>
            {tokenData?.details && (
              <div className="bg-gray-50 rounded-lg p-4 text-left mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Interview Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(tokenData.details.interviewDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(tokenData.details.interviewDate)} ({tokenData.details.interviewDuration} min)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{tokenData.details.jobTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Candidate: {tokenData.details.candidateName}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Interview Panel Invitation</CardTitle>
          <CardDescription>
            You've been invited to participate as an interviewer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokenData?.details && (
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Interview Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Position</p>
                    <p className="font-medium text-gray-900">{tokenData.details.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Company</p>
                    <p className="font-medium text-gray-900">{tokenData.details.companyName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Candidate</p>
                    <p className="font-medium text-gray-900">{tokenData.details.candidateName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Format</p>
                    <p className="font-medium text-gray-900 capitalize">{tokenData.details.interviewType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">{formatDate(tokenData.details.interviewDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Time</p>
                    <p className="font-medium text-gray-900">{formatTime(tokenData.details.interviewDate)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">{tokenData.details.interviewDuration} minutes</p>
                  </div>
                  {tokenData.details.meetingLink && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Meeting Link</p>
                      <a href={tokenData.details.meetingLink} className="text-blue-600 hover:underline text-sm break-all">
                        {tokenData.details.meetingLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleAccept}
                  disabled={acceptMutation.isPending}
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Accept Invitation
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                By accepting, you agree to participate in this interview panel and provide feedback after the interview.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
